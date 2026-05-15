const ManpowerRequest = require('../models/ManpowerRequest');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { isValidTransition } = require('../utils/statusWorkflows');
const { logStatusChange } = require('../utils/statusLogger');
const { sendRequestStatusEmail } = require('../utils/mailer');

const requestFields = [
    'assistanceType',
    'title',
    'description',
    'requestLocation',
    'requestDate',
    'requestTime',
    'estimatedDuration',
    'priority'
];

const requesterFields = ['firstName', 'middleName', 'lastName', 'suffix', 'contactNumber', 'email', 'address'];
const statusFields = ['status', 'adminNotes', 'completionNotes', 'assignedOfficers'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const normalizeText = (value) => String(value || '').trim();

const buildResidentRequestPayload = (residentId, requestData) => ({
    residentId,
    requesterType: 'resident',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    email: '',
    address: '',
    ...requestData
});

const buildGuestRequestPayload = (requestData) => ({
    ...requestData,
    residentId: null,
    requesterType: 'guest',
    firstName: normalizeText(requestData.firstName),
    middleName: normalizeText(requestData.middleName),
    lastName: normalizeText(requestData.lastName),
    suffix: normalizeText(requestData.suffix),
    contactNumber: normalizeText(requestData.contactNumber),
    email: normalizeText(requestData.email).toLowerCase(),
    address: normalizeText(requestData.address)
});

const getRequesterName = (request) => {
    const guestName = [request.firstName, request.middleName, request.lastName, request.suffix].filter(Boolean).join(' ').trim();

    if (guestName) {
        return guestName;
    }

    if (request.residentId) {
        return [request.residentId.firstName, request.residentId.middleName, request.residentId.lastName, request.residentId.suffix].filter(Boolean).join(' ').trim();
    }

    return 'Guest Requester';
};

const validateRequestData = (payload) => {
    if (payload.assistanceType !== undefined && !hasText(payload.assistanceType)) {
        return 'Please provide a valid assistanceType';
    }

    if (payload.title !== undefined && !hasText(payload.title)) {
        return 'Please provide a valid title';
    }

    if (payload.description !== undefined && !hasText(payload.description)) {
        return 'Please provide a valid description';
    }

    if (payload.requestLocation !== undefined && !hasText(payload.requestLocation)) {
        return 'Please provide a valid requestLocation';
    }

    if (payload.requestDate !== undefined && !isValidDate(payload.requestDate)) {
        return 'Please provide a valid requestDate';
    }

    return null;
};

const validateGuestRequestData = (payload) => {
    const required = ['firstName', 'lastName', 'contactNumber', 'email', 'address'];

    if (required.some((field) => !hasText(payload[field]))) {
        return 'firstName, lastName, contactNumber, email, and address are required';
    }

    return null;
};

const populateRequest = (query) => query.populate({
    path: 'residentId',
    select: 'firstName middleName lastName contactNumber email address purok userId',
    populate: {
        path: 'userId',
        select: 'username email role isActive'
    }
});

exports.createRequest = asyncHandler(async (req, res) => {
    const requestData = pickFields(req.body, requestFields);
    const validationError = validateRequestData(requestData);

    if (!requestData.assistanceType || !requestData.title || !requestData.description || !requestData.requestLocation || !requestData.requestDate) {
        throw createHttpError(400, 'assistanceType, title, description, requestLocation, and requestDate are required', {
            code: 'MANPOWER_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'MANPOWER_VALIDATION_ERROR' });
    }

    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'RESIDENT_NOT_FOUND'
        });
    }

    const request = await ManpowerRequest.create(buildResidentRequestPayload(resident._id, requestData));

    const populatedRequest = await populateRequest(ManpowerRequest.findById(request._id));
    res.status(201).json(populatedRequest);
});

exports.createPublicRequest = asyncHandler(async (req, res) => {
    const requestData = pickFields(req.body, [...requestFields, ...requesterFields]);
    const validationError = validateRequestData(requestData) || validateGuestRequestData(requestData);

    if (!requestData.assistanceType || !requestData.title || !requestData.description || !requestData.requestLocation || !requestData.requestDate) {
        throw createHttpError(400, 'assistanceType, title, description, requestLocation, and requestDate are required', {
            code: 'MANPOWER_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'MANPOWER_VALIDATION_ERROR' });
    }

    const request = await ManpowerRequest.create(buildGuestRequestPayload(requestData));
    const populatedRequest = await populateRequest(ManpowerRequest.findById(request._id));

    res.status(201).json(populatedRequest);
});

exports.getMyRequests = asyncHandler(async (req, res) => {
    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'RESIDENT_NOT_FOUND'
        });
    }

    const requests = await populateRequest(
        ManpowerRequest.find({ residentId: resident._id }).sort({ createdAt: -1 })
    );

    res.json(requests);
});

exports.getRequests = asyncHandler(async (req, res) => {
    const requests = await populateRequest(
        ManpowerRequest.find().sort({ createdAt: -1 })
    );

    res.json(requests);
});

exports.getRequestById = asyncHandler(async (req, res) => {
    const request = await populateRequest(
        ManpowerRequest.findById(req.params.id)
    );

    if (!request) {
        throw createHttpError(404, 'Manpower request not found', { code: 'MANPOWER_NOT_FOUND' });
    }

    if (req.user.role === 'resident') {
        const resident = await Resident.findOne({ userId: req.user.id });

        if (!request.residentId || !resident || request.residentId._id.toString() !== resident._id.toString()) {
            throw createHttpError(403, 'Access denied', { code: 'MANPOWER_FORBIDDEN' });
        }
    }

    res.json(request);
});

exports.updateRequestStatus = asyncHandler(async (req, res) => {
    const statusData = pickFields(req.body, statusFields);

    if (!statusData.status) {
        throw createHttpError(400, 'status is required', { code: 'MANPOWER_VALIDATION_ERROR' });
    }

    const request = await ManpowerRequest.findById(req.params.id);

    if (!request) {
        throw createHttpError(404, 'Manpower request not found', { code: 'MANPOWER_NOT_FOUND' });
    }

    // Validate status transition
    if (!isValidTransition('manpowerRequest', request.status, statusData.status)) {
        throw createHttpError(400, `Cannot transition from ${request.status} to ${statusData.status}`, {
            code: 'INVALID_STATUS_TRANSITION'
        });
    }

    const previousStatus = request.status;

    const updatedRequest = await ManpowerRequest.findByIdAndUpdate(
        req.params.id,
        statusData,
        { new: true, runValidators: true }
    );

    // Log the status change
    try {
        await logStatusChange(
            'ManpowerRequest',
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

    const populatedRequest = await populateRequest(
        ManpowerRequest.findById(updatedRequest._id)
    );

    const recipientEmail = populatedRequest.email || populatedRequest.residentId?.email;

    if (recipientEmail) {
        await sendRequestStatusEmail(
            recipientEmail,
            getRequesterName(populatedRequest),
            'manpower',
            statusData.status,
            statusData.adminNotes || ''
        );
    }

    res.json(populatedRequest);
});
