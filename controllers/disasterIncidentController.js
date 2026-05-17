const DisasterIncident = require('../models/DisasterIncident');
const DisasterAffectedRecord = require('../models/DisasterAffectedRecord');
const Report = require('../models/Report');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const incidentFields = [
    'title',
    'disasterType',
    'description',
    'affectedArea',
    'occurredAt',
    'severity',
    'status',
    'media',
    'source',
    'linkedReportIds'
];

const affectedFields = [
    'residentId',
    'familyHeadName',
    'householdSize',
    'isEvacuated',
    'injuredCount',
    'missingCount',
    'urgentNeeds',
    'remarks'
];

const normalizeNeeds = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const toBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return fallback;
    return parsed;
};

const buildIncidentPayload = (payload, userId) => {
    const data = pickFields(payload, incidentFields);
    if (data.media && !Array.isArray(data.media)) {
        data.media = String(data.media)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (data.linkedReportIds && !Array.isArray(data.linkedReportIds)) {
        data.linkedReportIds = [data.linkedReportIds];
    }
    if (!data.source) {
        data.source = 'manual';
    }
    if (!data.createdBy) {
        data.createdBy = userId;
    }

    return data;
};

const buildAffectedPayload = (payload) => {
    const data = pickFields(payload, affectedFields);
    data.urgentNeeds = normalizeNeeds(data.urgentNeeds);
    if (data.isEvacuated !== undefined) data.isEvacuated = toBoolean(data.isEvacuated);
    if (data.householdSize !== undefined) data.householdSize = toNumber(data.householdSize, 1);
    if (data.injuredCount !== undefined) data.injuredCount = toNumber(data.injuredCount, 0);
    if (data.missingCount !== undefined) data.missingCount = toNumber(data.missingCount, 0);
    return data;
};

const getIncidentSummary = async (incident) => {
    const affectedRecords = await DisasterAffectedRecord.find({ incidentId: incident._id }).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix isSeniorCitizen isPWD'
    });

    const linkedReports = await Report.find({
        _id: { $in: incident.linkedReportIds || [] }
    }).select('title reportType status priority createdAt locationText');

    const totals = affectedRecords.reduce((accumulator, record) => {
        accumulator.households += 1;
        accumulator.evacuees += record.isEvacuated ? 1 : 0;
        accumulator.injured += record.injuredCount || 0;
        accumulator.missing += record.missingCount || 0;

        const resident = record.residentId;
        if (resident?.isSeniorCitizen) accumulator.seniors += 1;
        if (resident?.isPWD) accumulator.pwds += 1;
        return accumulator;
    }, {
        households: 0,
        evacuees: 0,
        injured: 0,
        missing: 0,
        seniors: 0,
        pwds: 0
    });

    return {
        incident,
        affectedRecords,
        linkedReports,
        totals
    };
};

exports.getDisasterIncidents = asyncHandler(async (req, res) => {
    const incidents = await DisasterIncident.find()
        .populate('createdBy', 'username email')
        .sort({ occurredAt: -1, createdAt: -1 });

    res.json(incidents);
});

exports.createDisasterIncident = asyncHandler(async (req, res) => {
    const payload = buildIncidentPayload(req.body, req.user.id);

    if (!payload.title) {
        throw createHttpError(400, 'title is required', { code: 'DISASTER_VALIDATION_ERROR' });
    }

    const incident = await DisasterIncident.create(payload);
    const populated = await DisasterIncident.findById(incident._id).populate('createdBy', 'username email');
    res.status(201).json(populated);
});

exports.createDisasterIncidentFromReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.reportId);
    if (!report) {
        throw createHttpError(404, 'Report not found', { code: 'DISASTER_REPORT_NOT_FOUND' });
    }

    const incident = await DisasterIncident.create({
        title: report.title || 'Disaster Incident',
        disasterType: report.reportType === 'disaster' ? 'other' : 'other',
        description: report.description || '',
        affectedArea: report.locationText || '',
        occurredAt: report.incidentDate || report.createdAt || new Date(),
        severity: report.priority === 'emergency' ? 'critical' : (report.priority || 'medium'),
        status: 'active',
        source: 'resident_report',
        linkedReportIds: [report._id],
        createdBy: req.user.id
    });

    const populated = await DisasterIncident.findById(incident._id).populate('createdBy', 'username email');
    res.status(201).json(populated);
});

exports.getDisasterIncidentById = asyncHandler(async (req, res) => {
    const incident = await DisasterIncident.findById(req.params.id)
        .populate('createdBy', 'username email');

    if (!incident) {
        throw createHttpError(404, 'Disaster incident not found', { code: 'DISASTER_NOT_FOUND' });
    }

    const summary = await getIncidentSummary(incident);
    res.json(summary);
});

exports.updateDisasterIncident = asyncHandler(async (req, res) => {
    const payload = buildIncidentPayload(req.body, req.user.id);

    const incident = await DisasterIncident.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!incident) {
        throw createHttpError(404, 'Disaster incident not found', { code: 'DISASTER_NOT_FOUND' });
    }

    res.json(incident);
});

exports.addAffectedRecord = asyncHandler(async (req, res) => {
    const incident = await DisasterIncident.findById(req.params.id);
    if (!incident) {
        throw createHttpError(404, 'Disaster incident not found', { code: 'DISASTER_NOT_FOUND' });
    }

    const payload = buildAffectedPayload(req.body);

    if (!payload.residentId && !payload.familyHeadName) {
        throw createHttpError(400, 'residentId or familyHeadName is required', { code: 'DISASTER_VALIDATION_ERROR' });
    }

    if (payload.residentId) {
        const resident = await Resident.findById(payload.residentId);
        if (!resident) {
            throw createHttpError(404, 'Resident not found', { code: 'DISASTER_RESIDENT_NOT_FOUND' });
        }
    }

    const record = await DisasterAffectedRecord.create({
        incidentId: incident._id,
        ...payload
    });

    const populated = await DisasterAffectedRecord.findById(record._id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix isSeniorCitizen isPWD'
    });
    res.status(201).json(populated);
});

exports.updateAffectedRecord = asyncHandler(async (req, res) => {
    const payload = buildAffectedPayload(req.body);

    const record = await DisasterAffectedRecord.findByIdAndUpdate(
        req.params.affectedId,
        payload,
        { new: true, runValidators: true }
    ).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix isSeniorCitizen isPWD'
    });

    if (!record) {
        throw createHttpError(404, 'Affected record not found', { code: 'DISASTER_AFFECTED_NOT_FOUND' });
    }

    res.json(record);
});
