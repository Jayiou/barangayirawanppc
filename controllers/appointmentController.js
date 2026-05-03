const Appointment = require('../models/Appointment');
const Resident = require('../models/Resident');
const Official = require('../models/Official');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');

const appointmentFields = [
    'officialId',
    'appointmentDate',
    'timeSlot',
    'purpose',
    'concernDetails'
];

const appointmentStatusFields = ['status', 'adminNotes'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const validateAppointmentData = (payload) => {
    if (payload.appointmentDate !== undefined && !isValidDate(payload.appointmentDate)) {
        return 'Please provide a valid appointmentDate';
    }

    if (payload.timeSlot !== undefined && !hasText(payload.timeSlot)) {
        return 'Please provide a valid timeSlot';
    }

    if (payload.purpose !== undefined && !hasText(payload.purpose)) {
        return 'Please provide a valid purpose';
    }

    return null;
};

const populateAppointment = (query) => query
    .populate({
        path: 'residentId',
        select: 'firstName middleName lastName contactNumber email address purok userId',
        populate: {
            path: 'userId',
            select: 'username email role isActive'
        }
    })
    .populate('officialId', 'fullName position officeDays officeStartTime officeEndTime availabilityStatus officeLocation');

exports.createAppointment = asyncHandler(async (req, res) => {
    const appointmentData = pickFields(req.body, appointmentFields);
    const validationError = validateAppointmentData(appointmentData);

    if (!appointmentData.officialId || !appointmentData.appointmentDate || !appointmentData.timeSlot || !appointmentData.purpose) {
        throw createHttpError(400, 'officialId, appointmentDate, timeSlot, and purpose are required', {
            code: 'APPOINTMENT_VALIDATION_ERROR'
        });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'APPOINTMENT_VALIDATION_ERROR' });
    }

    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'APPOINTMENT_RESIDENT_NOT_FOUND'
        });
    }

    const official = await Official.findById(appointmentData.officialId);

    if (!official || !official.isActive) {
        throw createHttpError(404, 'Official not found', { code: 'APPOINTMENT_OFFICIAL_NOT_FOUND' });
    }

    const appointment = await Appointment.create({
        residentId: resident._id,
        ...appointmentData
    });

    const populatedAppointment = await populateAppointment(Appointment.findById(appointment._id));
    res.status(201).json(populatedAppointment);
});

exports.getMyAppointments = asyncHandler(async (req, res) => {
    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'APPOINTMENT_RESIDENT_NOT_FOUND'
        });
    }

    const appointments = await populateAppointment(
        Appointment.find({ residentId: resident._id }).sort({ createdAt: -1 })
    );

    res.json(appointments);
});

exports.getAppointments = asyncHandler(async (req, res) => {
    const appointments = await populateAppointment(
        Appointment.find().sort({ createdAt: -1 })
    );

    res.json(appointments);
});

exports.getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await populateAppointment(
        Appointment.findById(req.params.id)
    );

    if (!appointment) {
        throw createHttpError(404, 'Appointment not found', { code: 'APPOINTMENT_NOT_FOUND' });
    }

    if (req.user.role === 'resident') {
        const resident = await Resident.findOne({ userId: req.user.id });

        if (!resident || appointment.residentId._id.toString() !== resident._id.toString()) {
            throw createHttpError(403, 'Access denied', { code: 'APPOINTMENT_FORBIDDEN' });
        }
    }

    res.json(appointment);
});

exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
    const statusData = pickFields(req.body, appointmentStatusFields);

    if (!statusData.status) {
        throw createHttpError(400, 'status is required', { code: 'APPOINTMENT_VALIDATION_ERROR' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        statusData,
        { new: true, runValidators: true }
    );

    if (!appointment) {
        throw createHttpError(404, 'Appointment not found', { code: 'APPOINTMENT_NOT_FOUND' });
    }

    const populatedAppointment = await populateAppointment(
        Appointment.findById(appointment._id)
    );

    res.json(populatedAppointment);
});
