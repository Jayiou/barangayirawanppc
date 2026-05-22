const DisasterAdvisory = require('../models/DisasterAdvisory');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');

const ALLOWED_DISASTER_TYPES = new Set(['typhoon', 'flood', 'landslide']);

const normalizeStringList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
    return String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
};

const normalizeDisasterType = (value) => {
    const text = String(value || '').trim().toLowerCase();
    return ALLOWED_DISASTER_TYPES.has(text) ? text : 'typhoon';
};

const normalizeStatus = (advisory) => {
    if (advisory.status === 'ended') return 'ended';
    const expected = advisory.expectedImpactDate ? new Date(advisory.expectedImpactDate) : null;
    if (!expected || Number.isNaN(expected.getTime())) return advisory.status || 'upcoming';
    const now = new Date();
    return expected <= now ? 'ongoing' : 'upcoming';
};

const mapPayload = (body, userId, options) => {
    const { partial = false } = options || {};
    const source = body || {};
    const payload = {};

    if (!partial || source.disasterType !== undefined) {
        payload.disasterType = normalizeDisasterType(source.disasterType);
    }

    if (!partial || source.expectedImpactDate !== undefined) {
        payload.expectedImpactDate = source.expectedImpactDate;
    }

    if (!partial || source.severity !== undefined) {
        payload.severity = source.severity || 'medium';
    }

    if (!partial || source.floodProneAreas !== undefined) {
        payload.floodProneAreas = normalizeStringList(source.floodProneAreas);
    }

    if (!partial || source.evacuationCenters !== undefined) {
        payload.evacuationCenters = normalizeStringList(source.evacuationCenters);
    }

    if (!partial || source.advisoryMessage !== undefined) {
        payload.advisoryMessage = String(source.advisoryMessage || '').trim();
    }

    if (!partial || source.status !== undefined) {
        payload.status = source.status;
    }

    if (!partial) {
        payload.createdBy = userId;
    }

    return payload;
};

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
    const payload = mapPayload(req.body, req.user.id, { partial: true });

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
