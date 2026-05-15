const DocumentRequest = require('../models/DocumentRequest');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { sendDocumentStatusEmail, sendGeneratedDocumentEmail } = require('../utils/mailer');
const { sendDocumentStatusSMS } = require('../utils/sms');
const { isValidTransition } = require('../utils/statusWorkflows');
const { logStatusChange } = require('../utils/statusLogger');
const { generateDocumentPDF } = require('../utils/documentGenerator');
const path = require('path');
const fs = require('fs');

const documentRequestFields = [
    'documentType',
    'purpose',
    'requestDetails'
];

const requesterFields = [
    'firstName',
    'middleName',
    'lastName',
    'suffix',
    'contactNumber',
    'email',
    'address'
];

const publicDocumentRequestFields = [...documentRequestFields, ...requesterFields];

const documentRequestStatusFields = ['status', 'adminNotes'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const buildRequesterName = (request) => [request.firstName, request.middleName, request.lastName, request.suffix]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ')
    .trim();

const buildResidentRequesterDetails = (resident, requestData) => ({
    requesterType: 'resident',
    residentId: resident._id,
    firstName: normalizeText(resident.firstName),
    middleName: normalizeText(resident.middleName),
    lastName: normalizeText(resident.lastName),
    suffix: normalizeText(resident.suffix),
    contactNumber: normalizeText(resident.contactNumber),
    email: normalizeEmail(resident.email || requestData.email || ''),
    address: normalizeText(resident.address),
    ...requestData
});

const buildPublicRequesterDetails = (requestData) => ({
    requesterType: 'non_resident',
    residentId: null,
    firstName: normalizeText(requestData.firstName),
    middleName: normalizeText(requestData.middleName),
    lastName: normalizeText(requestData.lastName),
    suffix: normalizeText(requestData.suffix),
    contactNumber: normalizeText(requestData.contactNumber),
    email: normalizeEmail(requestData.email),
    address: normalizeText(requestData.address),
    documentType: requestData.documentType,
    purpose: requestData.purpose,
    requestDetails: requestData.requestDetails || ''
});

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

const validatePublicDocumentRequestData = (payload) => {
    const missingFields = ['firstName', 'lastName', 'email', 'address'].filter((field) => !hasText(payload[field]));

    if (missingFields.length > 0) {
        return 'documentType, purpose, firstName, lastName, email, and address are required';
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

    const documentRequest = await DocumentRequest.create(buildResidentRequesterDetails(resident, requestData));

    const populatedDocumentRequest = await populateDocumentRequest(
        DocumentRequest.findById(documentRequest._id)
    );

    res.status(201).json(populatedDocumentRequest);
});

exports.createPublicDocumentRequest = asyncHandler(async (req, res) => {
    const requestData = pickFields(req.body, publicDocumentRequestFields);
    const validationError = validateDocumentRequestData(requestData) || validatePublicDocumentRequestData(requestData);

    if (!requestData.documentType || !requestData.purpose) {
        throw createHttpError(400, 'documentType, purpose, firstName, lastName, email, and address are required', {
            code: 'DOCUMENT_REQUEST_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, {
            code: 'DOCUMENT_REQUEST_VALIDATION_ERROR'
        });
    }

    // Prevent duplicate requests from same email within 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRequest = await DocumentRequest.findOne({
        email: normalizeEmail(requestData.email),
        requesterType: 'non_resident',
        createdAt: { $gte: oneDayAgo }
    });

    if (existingRequest) {
        throw createHttpError(409, 'You already submitted a document request in the last 24 hours. Please check your email for updates or contact the barangay admin.', {
            code: 'DUPLICATE_REQUEST'
        });
    }

    const documentRequest = await DocumentRequest.create(buildPublicRequesterDetails(requestData));

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

        if (!resident || documentRequest.residentId?._id?.toString() !== resident._id.toString()) {
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

    const documentRequest = await DocumentRequest.findById(req.params.id);

    if (!documentRequest) {
        throw createHttpError(404, 'Document request not found', {
            code: 'DOCUMENT_REQUEST_NOT_FOUND'
        });
    }

    // Validate status transition
    if (!isValidTransition('documentRequest', documentRequest.status, statusData.status)) {
        throw createHttpError(400, `Cannot transition from ${documentRequest.status} to ${statusData.status}`, {
            code: 'INVALID_STATUS_TRANSITION'
        });
    }

    const previousStatus = documentRequest.status;

    // Update the document request
    const updatedDoc = await DocumentRequest.findByIdAndUpdate(
        req.params.id,
        statusData,
        { new: true, runValidators: true }
    );

    // Auto-generate PDF when status changes to 'approved'
    if (statusData.status === 'approved' && previousStatus !== 'approved') {
        try {
            const pdfPath = await generateDocumentPDF(updatedDoc, updatedDoc.documentType);
            await DocumentRequest.findByIdAndUpdate(
                req.params.id,
                { 
                    generatedDocumentPath: pdfPath,
                    documentGeneratedAt: new Date()
                },
                { new: true }
            );
            console.log(`PDF generated and stored for document request ${req.params.id}`);
        } catch (pdfError) {
            console.error('Failed to generate PDF for document request:', pdfError);
            // Don't fail the status update if PDF generation fails
            // Admin will see a warning and can retry
        }
    }

    // Log the status change
    try {
        await logStatusChange(
            'DocumentRequest',
            req.params.id,
            previousStatus,
            statusData.status,
            req.user,
            statusData.adminNotes || '',
            req.ip || req.connection.remoteAddress || ''
        );
    } catch (logError) {
        console.error('Failed to log status change:', logError);
        // Don't fail the request if logging fails
    }

    const populatedDocumentRequest = await populateDocumentRequest(
        DocumentRequest.findById(updatedDoc._id)
    );

    const residentEmail = populatedDocumentRequest.email || populatedDocumentRequest.residentId?.userId?.email || populatedDocumentRequest.residentId?.email;

    if (residentEmail) {
        const fullName = buildRequesterName(populatedDocumentRequest) || `${populatedDocumentRequest.residentId?.firstName || ''} ${populatedDocumentRequest.residentId?.lastName || ''}`.trim();
        await sendDocumentStatusEmail(
            residentEmail,
            fullName,
            populatedDocumentRequest.documentType,
            populatedDocumentRequest.status,
            populatedDocumentRequest.adminNotes
        );
    }

    const residentPhone = populatedDocumentRequest.contactNumber || populatedDocumentRequest.residentId?.contactNumber;
    if (residentPhone) {
        const fullName = buildRequesterName(populatedDocumentRequest) || `${populatedDocumentRequest.residentId?.firstName || ''} ${populatedDocumentRequest.residentId?.lastName || ''}`.trim();
        await sendDocumentStatusSMS(
            residentPhone,
            fullName,
            populatedDocumentRequest.documentType,
            populatedDocumentRequest.status,
            updatedDoc._id.toString()
        );
    }

    res.json(populatedDocumentRequest);
});

exports.sendDocumentToResident = asyncHandler(async (req, res) => {
    const documentRequest = await DocumentRequest.findById(req.params.id);

    if (!documentRequest) {
        throw createHttpError(404, 'Document request not found', {
            code: 'DOCUMENT_REQUEST_NOT_FOUND'
        });
    }

    // Only allow sending when status is 'ready_for_pickup'
    if (documentRequest.status !== 'ready_for_pickup') {
        throw createHttpError(400, `Document must be in 'ready_for_pickup' status to send. Current status: ${documentRequest.status}`, {
            code: 'INVALID_STATUS_FOR_SEND'
        });
    }

    // Check if document has been generated
    if (!documentRequest.generatedDocumentPath) {
        throw createHttpError(400, 'Document PDF has not been generated yet. Please approve the request first.', {
            code: 'DOCUMENT_NOT_GENERATED'
        });
    }

    // Check if document already sent
    if (documentRequest.documentSentAt) {
        throw createHttpError(400, `This document was already sent to the resident on ${documentRequest.documentSentAt.toLocaleDateString()}`, {
            code: 'DOCUMENT_ALREADY_SENT'
        });
    }

    const residentEmail = documentRequest.email || documentRequest.residentId?.email || documentRequest.residentId?.userId?.email;

    if (!residentEmail) {
        throw createHttpError(400, 'No email address found for this resident', {
            code: 'NO_EMAIL_ADDRESS'
        });
    }

    try {
        // Send email with PDF attachment
        const fullName = buildRequesterName(documentRequest) || `${documentRequest.residentId?.firstName || ''} ${documentRequest.residentId?.lastName || ''}`.trim();
        const filePath = documentRequest.generatedDocumentPath;

        await sendGeneratedDocumentEmail(
            residentEmail,
            fullName,
            documentRequest.documentType,
            filePath
        );

        // Update documentSentAt timestamp
        const updatedDoc = await DocumentRequest.findByIdAndUpdate(
            req.params.id,
            { documentSentAt: new Date() },
            { new: true, runValidators: true }
        );

        const populatedDocumentRequest = await populateDocumentRequest(
            DocumentRequest.findById(updatedDoc._id)
        );

        res.json({
            success: true,
            message: 'Document sent successfully to resident',
            documentRequest: populatedDocumentRequest
        });
    } catch (error) {
        console.error('Error sending document to resident:', error);
        throw createHttpError(500, 'Failed to send document to resident', {
            code: 'SEND_DOCUMENT_ERROR'
        });
    }
});

exports.previewDocument = asyncHandler(async (req, res) => {
    const documentRequest = await DocumentRequest.findById(req.params.id);

    if (!documentRequest) {
        throw createHttpError(404, 'Document request not found', {
            code: 'DOCUMENT_REQUEST_NOT_FOUND'
        });
    }

    // Check authorization - only admin can preview
    if (req.user.role !== 'admin') {
        throw createHttpError(403, 'Access denied. Only admins can preview documents.', {
            code: 'PREVIEW_FORBIDDEN'
        });
    }

    // If PDF has not been generated yet, attempt on-demand generation (helps recover from prior failures)
    if (!documentRequest.generatedDocumentPath) {
        try {
            const pdfPath = await generateDocumentPDF(documentRequest, documentRequest.documentType);
            await DocumentRequest.findByIdAndUpdate(req.params.id, {
                generatedDocumentPath: pdfPath,
                documentGeneratedAt: new Date()
            });
            // reload documentRequest to pick up generated path
            documentRequest.generatedDocumentPath = pdfPath;
        } catch (genErr) {
            console.error('On-demand PDF generation failed:', genErr);
            throw createHttpError(500, 'Failed to generate document PDF on-demand. Check server logs for details.', {
                code: 'DOCUMENT_GENERATION_FAILED'
            });
        }
    }

    // Verify file exists
    const filePath = path.join(process.cwd(), documentRequest.generatedDocumentPath);
    if (!fs.existsSync(filePath)) {
        throw createHttpError(404, 'Generated PDF file not found on server', {
            code: 'PDF_FILE_NOT_FOUND'
        });
    }

    // Send the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
    res.sendFile(filePath);
});
