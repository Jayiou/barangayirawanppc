const DocumentRequest = require('../models/DocumentRequest');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { sendDocumentStatusEmail } = require('../utils/mailer');

const documentRequestFields = [
    'documentType',
    'purpose',
    'requestDetails'
];

const documentRequestStatusFields = ['status', 'adminNotes'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const populateDocumentRequest = (query) => query.populate({
    path: 'residentId',
    select: 'firstName middleName lastName contactNumber email address purok userId',
    populate: {
        path: 'userId',
        select: 'username email role isActive'
    }
});

const validateDocumentRequestData = (payload) => {
    if (payload.documentType !== undefined && !hasText(payload.documentType)) {
        return 'Please provide a valid documentType';
    }

    if (payload.purpose !== undefined && !hasText(payload.purpose)) {
        return 'Please provide a valid purpose';
    }

    return null;
};

exports.createDocumentRequest = asyncHandler(async (req, res) => {
    const requestData = pickFields(req.body, documentRequestFields);
    const validationError = validateDocumentRequestData(requestData);

    if (!requestData.documentType || !requestData.purpose) {
        throw createHttpError(400, 'documentType and purpose are required', {
            code: 'DOCUMENT_REQUEST_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, {
            code: 'DOCUMENT_REQUEST_VALIDATION_ERROR'
        });
    }

    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'DOCUMENT_REQUEST_RESIDENT_NOT_FOUND'
        });
    }

    const documentRequest = await DocumentRequest.create({
        residentId: resident._id,
        ...requestData
    });

    const populatedDocumentRequest = await populateDocumentRequest(
        DocumentRequest.findById(documentRequest._id)
    );

    res.status(201).json(populatedDocumentRequest);
});

exports.getMyDocumentRequests = asyncHandler(async (req, res) => {
    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'DOCUMENT_REQUEST_RESIDENT_NOT_FOUND'
        });
    }

    const requests = await populateDocumentRequest(
        DocumentRequest.find({ residentId: resident._id }).sort({ createdAt: -1 })
    );

    res.json(requests);
});

exports.getDocumentRequests = asyncHandler(async (req, res) => {
    const requests = await populateDocumentRequest(
        DocumentRequest.find().sort({ createdAt: -1 })
    );

    res.json(requests);
});

exports.getDocumentRequestById = asyncHandler(async (req, res) => {
    const documentRequest = await populateDocumentRequest(
        DocumentRequest.findById(req.params.id)
    );

    if (!documentRequest) {
        throw createHttpError(404, 'Document request not found', {
            code: 'DOCUMENT_REQUEST_NOT_FOUND'
        });
    }

    if (req.user.role === 'resident') {
        const resident = await Resident.findOne({ userId: req.user.id });

        if (!resident || documentRequest.residentId._id.toString() !== resident._id.toString()) {
            throw createHttpError(403, 'Access denied', {
                code: 'DOCUMENT_REQUEST_FORBIDDEN'
            });
        }
    }

    res.json(documentRequest);
});

exports.updateDocumentRequestStatus = asyncHandler(async (req, res) => {
    const statusData = pickFields(req.body, documentRequestStatusFields);

    if (!statusData.status) {
        throw createHttpError(400, 'status is required', {
            code: 'DOCUMENT_REQUEST_VALIDATION_ERROR'
        });
    }

    const documentRequest = await DocumentRequest.findByIdAndUpdate(
        req.params.id,
        statusData,
        { new: true, runValidators: true }
    );

    if (!documentRequest) {
        throw createHttpError(404, 'Document request not found', {
            code: 'DOCUMENT_REQUEST_NOT_FOUND'
        });
    }

    const populatedDocumentRequest = await populateDocumentRequest(
        DocumentRequest.findById(documentRequest._id)
    );

    if (populatedDocumentRequest.residentId?.email) {
        const fullName = `${populatedDocumentRequest.residentId.firstName} ${populatedDocumentRequest.residentId.lastName}`.trim();
        await sendDocumentStatusEmail(
            populatedDocumentRequest.residentId.email,
            fullName,
            populatedDocumentRequest.documentType,
            populatedDocumentRequest.status,
            populatedDocumentRequest.adminNotes
        );
    }

    res.json(populatedDocumentRequest);
});
