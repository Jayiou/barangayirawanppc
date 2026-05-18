const DisasterAdvisory = require('../models/DisasterAdvisory');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');

const normalizeStringList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
    return String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
};

const normalizeStatus = (advisory) => {
    if (advisory.status === 'ended') return 'ended';
    const expected = advisory.expectedImpactDate ? new Date(advisory.expectedImpactDate) : null;
    if (!expected || Number.isNaN(expected.getTime())) return advisory.status || 'upcoming';
    const now = new Date();
    return expected <= now ? 'ongoing' : 'upcoming';
};

const mapPayload = (body = {}, userId) => ({
    disasterType: body.disasterType || 'other',
    expectedImpactDate: body.expectedImpactDate,
    severity: body.severity || 'medium',
    affectedPuroks: normalizeStringList(body.affectedPuroks),
    floodProneAreas: normalizeStringList(body.floodProneAreas),
    evacuationCenters: normalizeStringList(body.evacuationCenters),
    advisoryMessage: String(body.advisoryMessage || '').trim(),
    status: body.status,
    createdBy: userId
});

exports.getAdminDisasterAdvisories = asyncHandler(async (_req, res) => {
    const advisories = await DisasterAdvisory.find()
        .populate('createdBy', 'username email')
        .sort({ expectedImpactDate: 1, createdAt: -1 });

    const normalized = advisories.map((advisory) => {
        const advisoryObject = advisory.toObject();
        advisoryObject.status = normalizeStatus(advisoryObject);
        return advisoryObject;
    });

    res.json(normalized);
});

exports.getPublicDisasterAdvisories = asyncHandler(async (_req, res) => {
    const advisories = await DisasterAdvisory.find({ status: { $in: ['upcoming', 'ongoing'] } })
        .sort({ expectedImpactDate: 1, createdAt: -1 })
        .lean();

    const normalized = advisories.map((advisory) => ({
        ...advisory,
        status: normalizeStatus(advisory)
    }));

    res.json(normalized.filter((advisory) => advisory.status !== 'ended'));
});

exports.createDisasterAdvisory = asyncHandler(async (req, res) => {
    const payload = mapPayload(req.body, req.user.id);
    if (!payload.expectedImpactDate) {
        throw createHttpError(400, 'expectedImpactDate is required', { code: 'DISASTER_ADVISORY_VALIDATION' });
    }
    if (!payload.advisoryMessage) {
        throw createHttpError(400, 'advisoryMessage is required', { code: 'DISASTER_ADVISORY_VALIDATION' });
    }

    const advisory = await DisasterAdvisory.create({
        ...payload,
        status: payload.status || 'upcoming'
    });

    const populated = await DisasterAdvisory.findById(advisory._id).populate('createdBy', 'username email');
    const response = populated.toObject();
    response.status = normalizeStatus(response);
    res.status(201).json(response);
});

exports.updateDisasterAdvisory = asyncHandler(async (req, res) => {
    const payload = mapPayload(req.body, req.user.id);
    delete payload.createdBy;
    if (!req.body.expectedImpactDate) delete payload.expectedImpactDate;
    if (!req.body.advisoryMessage) delete payload.advisoryMessage;
    if (!req.body.status) delete payload.status;

    const advisory = await DisasterAdvisory.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!advisory) {
        throw createHttpError(404, 'Disaster advisory not found', { code: 'DISASTER_ADVISORY_NOT_FOUND' });
    }

    const response = advisory.toObject();
    response.status = normalizeStatus(response);
    res.json(response);
});

exports.deleteDisasterAdvisory = asyncHandler(async (req, res) => {
    const advisory = await DisasterAdvisory.findByIdAndDelete(req.params.id);
    if (!advisory) {
        throw createHttpError(404, 'Disaster advisory not found', { code: 'DISASTER_ADVISORY_NOT_FOUND' });
    }

    res.json({ message: 'Disaster advisory deleted successfully.' });
});
