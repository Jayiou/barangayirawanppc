const Official = require('../models/Official');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');

const allowedOfficialFields = [
    'fullName',
    'position',
    'contactNumber',
    'email',
    'officeDays',
    'officeStartTime',
    'officeEndTime',
    'availabilityStatus',
    'officeLocation',
    'photo',
    'termStart',
    'termEnd',
    'isActive'
];

const pickOfficialFields = (source) => allowedOfficialFields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const normalizeOfficeDays = (officeDays) => {
    if (!Array.isArray(officeDays)) {
        return officeDays;
    }

    return officeDays
        .map((day) => String(day).trim())
        .filter(Boolean);
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const validateOfficialData = (payload) => {
    if (payload.email !== undefined && payload.email !== '' && !emailRegex.test(String(payload.email).trim())) {
        return 'Please provide a valid official email address';
    }

    if (payload.termStart !== undefined && payload.termStart !== null && !isValidDate(payload.termStart)) {
        return 'Please provide a valid termStart date';
    }

    if (payload.termEnd !== undefined && payload.termEnd !== null && !isValidDate(payload.termEnd)) {
        return 'Please provide a valid termEnd date';
    }

    return null;
};

exports.createOfficial = asyncHandler(async (req, res) => {
    const officialData = pickOfficialFields(req.body);
    const validationError = validateOfficialData(officialData);

    if (!officialData.fullName || !officialData.position) {
        throw createHttpError(400, 'fullName and position are required', { code: 'OFFICIAL_VALIDATION_ERROR' });
    }

    officialData.officeDays = normalizeOfficeDays(officialData.officeDays);

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'OFFICIAL_VALIDATION_ERROR' });
    }

    const official = await Official.create(officialData);
    res.status(201).json(official);
});

exports.getOfficials = asyncHandler(async (req, res) => {
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    const officials = await Official.find(filter).sort({ position: 1, fullName: 1 });
    res.json(officials);
});

exports.getOfficialById = asyncHandler(async (req, res) => {
    const official = await Official.findById(req.params.id);

    if (!official) {
        throw createHttpError(404, 'Official not found', { code: 'OFFICIAL_NOT_FOUND' });
    }

    if (req.user.role !== 'admin' && !official.isActive) {
        throw createHttpError(404, 'Official not found', { code: 'OFFICIAL_NOT_FOUND' });
    }

    res.json(official);
});

exports.updateOfficial = asyncHandler(async (req, res) => {
    const officialData = pickOfficialFields(req.body);
    const validationError = validateOfficialData(officialData);

    if (officialData.officeDays !== undefined) {
        officialData.officeDays = normalizeOfficeDays(officialData.officeDays);
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'OFFICIAL_VALIDATION_ERROR' });
    }

    const official = await Official.findByIdAndUpdate(req.params.id, officialData, {
        new: true,
        runValidators: true
    });

    if (!official) {
        throw createHttpError(404, 'Official not found', { code: 'OFFICIAL_NOT_FOUND' });
    }

    res.json(official);
});

exports.deleteOfficial = asyncHandler(async (req, res) => {
    const official = await Official.findByIdAndDelete(req.params.id);

    if (!official) {
        throw createHttpError(404, 'Official not found', { code: 'OFFICIAL_NOT_FOUND' });
    }

    res.json({ message: 'Official deleted successfully' });
});
