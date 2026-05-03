const Report = require('../models/Report');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');

const reportFields = [
    'reportType',
    'title',
    'description',
    'locationText',
    'incidentDate',
    'priority',
    'isAnonymous',
    'contactPreference'
];

const reportStatusFields = ['status', 'adminNotes'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

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
    const reportData = pickFields(req.body, reportFields);
    const validationError = validateReportData(reportData);

    if (!reportData.reportType || !reportData.title || !reportData.description || !reportData.locationText) {
        throw createHttpError(400, 'reportType, title, description, and locationText are required', {
            code: 'REPORT_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'REPORT_VALIDATION_ERROR' });
    }

    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'REPORT_RESIDENT_NOT_FOUND'
        });
    }

    const report = await Report.create({
        residentId: resident._id,
        ...reportData
    });

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

        if (!resident || report.residentId._id.toString() !== resident._id.toString()) {
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

    const report = await Report.findByIdAndUpdate(
        req.params.id,
        statusData,
        { new: true, runValidators: true }
    );

    if (!report) {
        throw createHttpError(404, 'Report not found', { code: 'REPORT_NOT_FOUND' });
    }

    const populatedReport = await populateReport(
        Report.findById(report._id)
    );

    res.json(populatedReport);
});
