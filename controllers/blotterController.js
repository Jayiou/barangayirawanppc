const Blotter = require('../models/Blotter');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { isValidTransition } = require('../utils/statusWorkflows');
const { logStatusChange } = require('../utils/statusLogger');
const { sendRequestStatusEmail } = require('../utils/mailer');

const blotterFields = [
    'complainantName',
    'complainantAddress',
    'complainantContactNumber',
    'complainantEmail',
    'respondentName',
    'respondentAddress',
    'incidentDate',
    'incidentTime',
    'incidentLocation',
    'narrative',
    'blotterType'
];

const blotterStatusFields = ['status', 'investigatingOfficer', 'findings', 'adminNotes'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const validateBlotterData = (payload) => {
    if (payload.complainantName !== undefined && !hasText(payload.complainantName)) {
        return 'Please provide a valid complainant name';
    }

    if (payload.respondentName !== undefined && !hasText(payload.respondentName)) {
        return 'Please provide a valid respondent name';
    }

    if (payload.narrative !== undefined && !hasText(payload.narrative)) {
        return 'Please provide a valid narrative';
    }

    if (payload.incidentDate !== undefined && !isValidDate(payload.incidentDate)) {
        return 'Please provide a valid incident date';
    }

    return null;
};

exports.createBlotter = asyncHandler(async (req, res) => {
    const blotterData = pickFields(req.body, blotterFields);
    const validationError = validateBlotterData(blotterData);

    if (!blotterData.complainantName || !blotterData.respondentName || !blotterData.narrative || !blotterData.incidentDate) {
        throw createHttpError(400, 'complainantName, respondentName, narrative, and incidentDate are required', {
            code: 'BLOTTER_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'BLOTTER_VALIDATION_ERROR' });
    }

    const blotter = await Blotter.create(blotterData);
    res.status(201).json(blotter);
});

exports.getBlotters = asyncHandler(async (req, res) => {
    const blotters = await Blotter.find().sort({ createdAt: -1 });
    res.json(blotters);
});

exports.getBlotterById = asyncHandler(async (req, res) => {
    const blotter = await Blotter.findById(req.params.id);

    if (!blotter) {
        throw createHttpError(404, 'Blotter record not found', { code: 'BLOTTER_NOT_FOUND' });
    }

    res.json(blotter);
});

exports.updateBlotter = asyncHandler(async (req, res) => {
    const blotter = await Blotter.findById(req.params.id);

    if (!blotter) {
        throw createHttpError(404, 'Blotter record not found', { code: 'BLOTTER_NOT_FOUND' });
    }

    const allowedFields = [...blotterFields, ...blotterStatusFields];
    const updateData = pickFields(req.body, allowedFields);

    const validationError = validateBlotterData(updateData);
    if (validationError) {
        throw createHttpError(400, validationError, { code: 'BLOTTER_VALIDATION_ERROR' });
    }

    // Handle status transition
    if (updateData.status && updateData.status !== blotter.status) {
        if (!isValidTransition('blotter', blotter.status, updateData.status)) {
            throw createHttpError(400, `Cannot transition from ${blotter.status} to ${updateData.status}`, {
                code: 'INVALID_STATUS_TRANSITION'
            });
        }

        const previousStatus = blotter.status;

        try {
            await logStatusChange(
                'Blotter',
                req.params.id,
                previousStatus,
                updateData.status,
                req.user,
                updateData.adminNotes || '',
                req.ip || req.connection?.remoteAddress || ''
            );
        } catch (logError) {
            console.error('Failed to log status change:', logError);
        }

        // Update recordedBy and recordedDate if status becomes "recorded"
        if (updateData.status === 'recorded') {
            updateData.recordedBy = `${req.user.username || req.user.email}`;
            updateData.recordedDate = new Date();
        }
    }

    const updatedBlotter = await Blotter.findByIdAndUpdate(
        req.params.id,
        updateData,
        { returnDocument: 'after', runValidators: true }
    );

    res.json(updatedBlotter);
});

exports.deleteBlotter = asyncHandler(async (req, res) => {
    const blotter = await Blotter.findByIdAndDelete(req.params.id);

    if (!blotter) {
        throw createHttpError(404, 'Blotter record not found', { code: 'BLOTTER_NOT_FOUND' });
    }

    res.json({ message: 'Blotter record deleted successfully' });
});
