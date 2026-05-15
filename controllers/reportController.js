const Report = require('../models/Report');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { isValidTransition } = require('../utils/statusWorkflows');
const { logStatusChange } = require('../utils/statusLogger');
const { sendRequestStatusEmail } = require('../utils/mailer');
const { getReportTypeRule } = require('../utils/reportTypeConfig');

const reportFields = [
    'reportType',
    'title',
    'description',
    'locationText',
    'locationLatitude',
    'locationLongitude',
    'locationAccuracy',
    'incidentDate',
    'priority',
    'isAnonymous',
    'contactPreference'
];

const reportRequesterFields = ['firstName', 'middleName', 'lastName', 'suffix', 'contactNumber', 'email', 'address'];
const reportStatusFields = ['status', 'adminNotes'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const normalizeText = (value) => String(value || '').trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const toNullableNumber = (value) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const toBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }

    return String(value).toLowerCase() === 'true';
};

const extractLocationCoordinates = (payload) => {
    const latitude = toNullableNumber(payload.locationLatitude);
    const longitude = toNullableNumber(payload.locationLongitude);
    const accuracy = toNullableNumber(payload.locationAccuracy);

    if (Number.isNaN(latitude) || Number.isNaN(longitude) || Number.isNaN(accuracy)) {
        return { error: 'Please provide valid location coordinates' };
    }

    if (latitude === null || longitude === null) {
        return { coordinates: { latitude: null, longitude: null, accuracy: null } };
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return { error: 'Location coordinates are out of valid range' };
    }

    return {
        coordinates: {
            latitude,
            longitude,
            accuracy: accuracy === null ? null : Math.max(0, accuracy)
        }
    };
};

const extractProofFiles = (files) => {
    if (!Array.isArray(files) || files.length === 0) {
        return [];
    }

    return files.map((file) => `/uploads/${file.filename}`);
};

const normalizeReportPayload = (payload, files = []) => {
    const locationData = extractLocationCoordinates(payload);

    if (locationData.error) {
        return { error: locationData.error };
    }

    const normalized = {
        ...payload,
        isAnonymous: toBoolean(payload.isAnonymous),
        locationCoordinates: locationData.coordinates,
        proofFiles: extractProofFiles(files)
    };

    delete normalized.locationLatitude;
    delete normalized.locationLongitude;
    delete normalized.locationAccuracy;

    return { payload: normalized };
};

const buildResidentReportPayload = (residentId, reportData) => ({
    residentId,
    requesterType: 'resident',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    email: '',
    address: '',
    ...reportData
});

const buildGuestReportPayload = (reportData) => ({
    ...reportData,
    residentId: null,
    requesterType: 'guest',
    firstName: normalizeText(reportData.firstName),
    middleName: normalizeText(reportData.middleName),
    lastName: normalizeText(reportData.lastName),
    suffix: normalizeText(reportData.suffix),
    contactNumber: normalizeText(reportData.contactNumber),
    email: normalizeText(reportData.email).toLowerCase(),
    address: normalizeText(reportData.address)
});

const getReportRequesterName = (report) => {
    const guestName = [report.firstName, report.middleName, report.lastName, report.suffix].filter(Boolean).join(' ').trim();

    if (guestName) {
        return guestName;
    }

    if (report.residentId) {
        return [report.residentId.firstName, report.residentId.middleName, report.residentId.lastName, report.residentId.suffix].filter(Boolean).join(' ').trim();
    }

    return 'Guest Reporter';
};

const validateReportData = (payload) => {
    if (payload.reportType !== undefined && !hasText(payload.reportType)) {
        return 'Please provide a valid reportType';
    }

    if (payload.title !== undefined && !hasText(payload.title)) {
        return 'Please provide a valid title';
    }

    if (payload.description !== undefined && !hasText(payload.description)) {
        return 'Please provide a valid description';
    }

    if (payload.locationText !== undefined && !hasText(payload.locationText)) {
        return 'Please provide a valid locationText';
    }

    if (payload.incidentDate !== undefined && payload.incidentDate !== null && !isValidDate(payload.incidentDate)) {
        return 'Please provide a valid incidentDate';
    }

    if (payload.proofFiles !== undefined && !Array.isArray(payload.proofFiles)) {
        return 'Please provide valid proof files';
    }

    return null;
};

const validateGuestReportData = (payload) => {
    const required = ['firstName', 'lastName', 'contactNumber', 'email', 'address'];

    if (required.some((field) => !hasText(payload[field]))) {
        return 'firstName, lastName, contactNumber, email, and address are required';
    }

    return null;
};

const validateTypeSpecificRules = (payload, options = {}) => {
    const { enforceProofForResident = false } = options;
    const rules = getReportTypeRule(payload.reportType);

    if (!rules) {
        return 'Please provide a valid reportType';
    }

    if (rules.requireIncidentDate && !payload.incidentDate) {
        return 'incidentDate is required for this report type';
    }

    if (enforceProofForResident && rules.requireProofForResident) {
        if (!Array.isArray(payload.proofFiles) || payload.proofFiles.length === 0) {
            return 'At least one proof image is required for this report type';
        }
    }

    return null;
};

const populateReport = (query) => query.populate({
    path: 'residentId',
    select: 'firstName middleName lastName contactNumber email address purok userId',
    populate: {
        path: 'userId',
        select: 'username email role isActive'
    }
});

exports.createReport = asyncHandler(async (req, res) => {
    const pickedData = pickFields(req.body, reportFields);
    const normalized = normalizeReportPayload(pickedData, req.files);

    if (normalized.error) {
        throw createHttpError(400, normalized.error, { code: 'REPORT_VALIDATION_ERROR' });
    }

    const reportData = normalized.payload;
    const validationError = validateReportData(reportData);

    if (!reportData.reportType || !reportData.title || !reportData.description || !reportData.locationText) {
        throw createHttpError(400, 'reportType, title, description, and locationText are required', {
            code: 'REPORT_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'REPORT_VALIDATION_ERROR' });
    }

    const typeValidationError = validateTypeSpecificRules(reportData, { enforceProofForResident: true });

    if (typeValidationError) {
        throw createHttpError(400, typeValidationError, {
            code: 'REPORT_VALIDATION_ERROR'
        });
    }

    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'REPORT_RESIDENT_NOT_FOUND'
        });
    }

    const report = await Report.create(buildResidentReportPayload(resident._id, reportData));

    const populatedReport = await populateReport(Report.findById(report._id));
    res.status(201).json(populatedReport);
});

exports.createPublicReport = asyncHandler(async (req, res) => {
    const pickedData = pickFields(req.body, [...reportFields, ...reportRequesterFields]);
    const normalized = normalizeReportPayload(pickedData);

    if (normalized.error) {
        throw createHttpError(400, normalized.error, { code: 'REPORT_VALIDATION_ERROR' });
    }

    const reportData = normalized.payload;
    const validationError = validateReportData(reportData) || validateGuestReportData(reportData);

    if (!reportData.reportType || !reportData.title || !reportData.description || !reportData.locationText) {
        throw createHttpError(400, 'reportType, title, description, and locationText are required', {
            code: 'REPORT_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'REPORT_VALIDATION_ERROR' });
    }

    // Prevent duplicate reports from same email within 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReport = await Report.findOne({
        email: normalizeEmail(reportData.email),
        requesterType: 'guest',
        createdAt: { $gte: oneDayAgo }
    });

    if (existingReport) {
        throw createHttpError(409, 'You already submitted a report in the last 24 hours. Please check your email for updates or contact the barangay admin.', {
            code: 'DUPLICATE_REQUEST'
        });
    }

    const report = await Report.create(buildGuestReportPayload(reportData));
    const populatedReport = await populateReport(Report.findById(report._id));

    res.status(201).json(populatedReport);
});

exports.getMyReports = asyncHandler(async (req, res) => {
    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'REPORT_RESIDENT_NOT_FOUND'
        });
    }

    const reports = await populateReport(
        Report.find({ residentId: resident._id }).sort({ createdAt: -1 })
    );

    res.json(reports);
});

exports.getReports = asyncHandler(async (req, res) => {
    const reports = await populateReport(
        Report.find().sort({ createdAt: -1 })
    );

    res.json(reports);
});

exports.getReportById = asyncHandler(async (req, res) => {
    const report = await populateReport(
        Report.findById(req.params.id)
    );

    if (!report) {
        throw createHttpError(404, 'Report not found', { code: 'REPORT_NOT_FOUND' });
    }

    if (req.user.role === 'resident') {
        const resident = await Resident.findOne({ userId: req.user.id });

        if (!report.residentId || !resident || report.residentId._id.toString() !== resident._id.toString()) {
            throw createHttpError(403, 'Access denied', { code: 'REPORT_FORBIDDEN' });
        }
    }

    res.json(report);
});

exports.updateReportStatus = asyncHandler(async (req, res) => {
    const statusData = pickFields(req.body, reportStatusFields);

    if (!statusData.status) {
        throw createHttpError(400, 'status is required', { code: 'REPORT_VALIDATION_ERROR' });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
        throw createHttpError(404, 'Report not found', { code: 'REPORT_NOT_FOUND' });
    }

    // Validate status transition
    if (!isValidTransition('report', report.status, statusData.status)) {
        throw createHttpError(400, `Cannot transition from ${report.status} to ${statusData.status}`, {
            code: 'INVALID_STATUS_TRANSITION'
        });
    }

    const previousStatus = report.status;

    const updatedReport = await Report.findByIdAndUpdate(
        req.params.id,
        statusData,
        { new: true, runValidators: true }
    );

    if (!updatedReport) {
        throw createHttpError(404, 'Report not found', { code: 'REPORT_NOT_FOUND' });
    }

    // Log the status change
    try {
        await logStatusChange(
            'Report',
            req.params.id,
            previousStatus,
            statusData.status,
            req.user,
            statusData.adminNotes || '',
            req.ip || req.connection?.remoteAddress || ''
        );
    } catch (logError) {
        console.error('Failed to log status change:', logError);
    }

    const populatedReport = await populateReport(
        Report.findById(updatedReport._id)
    );

    const recipientEmail = populatedReport.email || populatedReport.residentId?.email;

    if (recipientEmail) {
        await sendRequestStatusEmail(
            recipientEmail,
            getReportRequesterName(populatedReport),
            'report',
            statusData.status,
            statusData.adminNotes || ''
        );
    }

    res.json(populatedReport);
});
