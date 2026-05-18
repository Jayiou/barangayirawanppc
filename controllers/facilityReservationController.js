const FacilityReservation = require('../models/FacilityReservation');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { isValidTransition } = require('../utils/statusWorkflows');
const { logStatusChange } = require('../utils/statusLogger');
const { sendRequestStatusEmail } = require('../utils/mailer');

const reservationFields = [
    'facilityName',
    'reservationDate',
    'startTime',
    'endTime',
    'purpose',
    'reservationDetails'
];

const reservationRequesterFields = ['firstName', 'middleName', 'lastName', 'suffix', 'contactNumber', 'email', 'address'];
const reservationStatusFields = ['status', 'adminNotes'];
const OPERATING_HOURS = {
    start: '08:00',
    end: '17:00'
};
const SLOT_DURATION_MINUTES = 60;
const CONFLICT_STATUSES = ['approved', 'rescheduled'];

const pickFields = (source, fields) => fields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const normalizeText = (value) => String(value || '').trim();
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const isValidTime = (value) => hasText(value) && timePattern.test(value.trim());

const toMinutes = (value) => {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours * 60) + minutes;
};

const sameDayRange = (value) => {
    const day = new Date(value);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    return { day, nextDay };
};

const rangesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const validateTimeWindow = (startTime, endTime) => {
    if (startTime !== undefined && !isValidTime(startTime)) {
        return 'Please provide a valid startTime in HH:MM format';
    }

    if (endTime !== undefined && !isValidTime(endTime)) {
        return 'Please provide a valid endTime in HH:MM format';
    }

    if (startTime !== undefined && endTime !== undefined && toMinutes(startTime) >= toMinutes(endTime)) {
        return 'endTime must be later than startTime';
    }

    if (
        startTime !== undefined
        && endTime !== undefined
        && (
            toMinutes(startTime) < toMinutes(OPERATING_HOURS.start)
            || toMinutes(endTime) > toMinutes(OPERATING_HOURS.end)
        )
    ) {
        return `Reservations must be within operating hours ${OPERATING_HOURS.start}-${OPERATING_HOURS.end}`;
    }

    return null;
};

const populateReservation = (query) => query.populate({
    path: 'residentId',
    select: 'firstName middleName lastName contactNumber email address purok userId',
    populate: {
        path: 'userId',
        select: 'username email role isActive'
    }
});

const buildResidentReservationPayload = (residentId, reservationData) => ({
    residentId,
    requesterType: 'resident',
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    contactNumber: '',
    email: '',
    address: '',
    ...reservationData
});

const buildGuestReservationPayload = (reservationData) => ({
    ...reservationData,
    residentId: null,
    requesterType: 'guest',
    firstName: normalizeText(reservationData.firstName),
    middleName: normalizeText(reservationData.middleName),
    lastName: normalizeText(reservationData.lastName),
    suffix: normalizeText(reservationData.suffix),
    contactNumber: normalizeText(reservationData.contactNumber),
    email: normalizeText(reservationData.email).toLowerCase(),
    address: normalizeText(reservationData.address)
});

const getReservationRequesterName = (reservation) => {
    const guestName = [reservation.firstName, reservation.middleName, reservation.lastName, reservation.suffix].filter(Boolean).join(' ').trim();

    if (guestName) {
        return guestName;
    }

    if (reservation.residentId) {
        return [reservation.residentId.firstName, reservation.residentId.middleName, reservation.residentId.lastName, reservation.residentId.suffix].filter(Boolean).join(' ').trim();
    }

    return 'Guest Requester';
};

const validateReservationData = (payload) => {
    if (payload.reservationDate !== undefined && !isValidDate(payload.reservationDate)) {
        return 'Please provide a valid reservationDate';
    }

    if (payload.startTime !== undefined && !hasText(payload.startTime)) {
        return 'Please provide a valid startTime';
    }

    if (payload.endTime !== undefined && !hasText(payload.endTime)) {
        return 'Please provide a valid endTime';
    }

    if (payload.purpose !== undefined && !hasText(payload.purpose)) {
        return 'Please provide a valid purpose';
    }

    const timeWindowError = validateTimeWindow(payload.startTime, payload.endTime);

    if (timeWindowError) {
        return timeWindowError;
    }

    return null;
};

const validateGuestReservationData = (payload) => {
    const required = ['firstName', 'lastName', 'contactNumber', 'email', 'address'];

    if (required.some((field) => !hasText(payload[field]))) {
        return 'firstName, lastName, contactNumber, email, and address are required';
    }

    return null;
};

const findConflictingReservation = async ({
    facilityName,
    reservationDate,
    startTime,
    endTime,
    excludeReservationId
}) => {
    const { day, nextDay } = sameDayRange(reservationDate);
    const reservations = await FacilityReservation.find({
        facilityName,
        reservationDate: {
            $gte: day,
            $lt: nextDay
        },
        status: { $in: CONFLICT_STATUSES }
    });

    const requestedStart = toMinutes(startTime);
    const requestedEnd = toMinutes(endTime);

    return reservations.find((reservation) => {
        if (reservation._id?.toString() === excludeReservationId?.toString()) {
            return false;
        }

        return rangesOverlap(
            requestedStart,
            requestedEnd,
            toMinutes(reservation.startTime),
            toMinutes(reservation.endTime)
        );
    }) || null;
};

const buildAvailableSlots = (reservations) => {
    const slots = [];
    const reservedRanges = reservations.map((reservation) => ({
        start: toMinutes(reservation.startTime),
        end: toMinutes(reservation.endTime)
    }));

    for (
        let current = toMinutes(OPERATING_HOURS.start);
        current + SLOT_DURATION_MINUTES <= toMinutes(OPERATING_HOURS.end);
        current += SLOT_DURATION_MINUTES
    ) {
        const slotStart = current;
        const slotEnd = current + SLOT_DURATION_MINUTES;

        const hasConflict = reservedRanges.some((range) => rangesOverlap(slotStart, slotEnd, range.start, range.end));

        if (!hasConflict) {
            const startHours = String(Math.floor(slotStart / 60)).padStart(2, '0');
            const startMinutes = String(slotStart % 60).padStart(2, '0');
            const endHours = String(Math.floor(slotEnd / 60)).padStart(2, '0');
            const endMinutes = String(slotEnd % 60).padStart(2, '0');

            slots.push({
                startTime: `${startHours}:${startMinutes}`,
                endTime: `${endHours}:${endMinutes}`
            });
        }
    }

    return slots;
};

exports.createFacilityReservation = asyncHandler(async (req, res) => {
    const reservationData = pickFields(req.body, reservationFields);
    const validationError = validateReservationData(reservationData);

    if (
        !reservationData.facilityName
        || !reservationData.reservationDate
        || !reservationData.startTime
        || !reservationData.endTime
        || !reservationData.purpose
    ) {
        throw createHttpError(
            400,
            'facilityName, reservationDate, startTime, endTime, and purpose are required',
            { code: 'FACILITY_RESERVATION_VALIDATION_ERROR' }
        );
    }

    if (validationError) {
        throw createHttpError(400, validationError, {
            code: 'FACILITY_RESERVATION_VALIDATION_ERROR'
        });
    }

    const conflictingReservation = await findConflictingReservation(reservationData);

    if (conflictingReservation) {
        throw createHttpError(409, 'This facility is already reserved for the selected date and time.', {
            code: 'FACILITY_RESERVATION_CONFLICT'
        });
    }

    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'FACILITY_RESERVATION_RESIDENT_NOT_FOUND'
        });
    }

    const reservation = await FacilityReservation.create(buildResidentReservationPayload(resident._id, reservationData));

    const populatedReservation = await populateReservation(
        FacilityReservation.findById(reservation._id)
    );

    res.status(201).json(populatedReservation);
});

exports.createPublicFacilityReservation = asyncHandler(async (req, res) => {
    const reservationData = pickFields(req.body, [...reservationFields, ...reservationRequesterFields]);
    const validationError = validateReservationData(reservationData) || validateGuestReservationData(reservationData);

    if (
        !reservationData.facilityName
        || !reservationData.reservationDate
        || !reservationData.startTime
        || !reservationData.endTime
        || !reservationData.purpose
    ) {
        throw createHttpError(
            400,
            'facilityName, reservationDate, startTime, endTime, and purpose are required',
            { code: 'FACILITY_RESERVATION_VALIDATION_ERROR' }
        );
    }

    if (validationError) {
        throw createHttpError(400, validationError, {
            code: 'FACILITY_RESERVATION_VALIDATION_ERROR'
        });
    }

    // Prevent duplicate reservations from same email within 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingReservation = await FacilityReservation.findOne({
        email: normalizeEmail(reservationData.email),
        requesterType: 'guest',
        createdAt: { $gte: oneDayAgo }
    });

    if (existingReservation) {
        throw createHttpError(409, 'You already submitted a facility reservation request in the last 24 hours. Please check your email for updates or contact the barangay admin.', {
            code: 'DUPLICATE_REQUEST'
        });
    }

    const conflictingReservation = await findConflictingReservation(reservationData);

    if (conflictingReservation) {
        throw createHttpError(409, 'This facility is already reserved for the selected date and time.', {
            code: 'FACILITY_RESERVATION_CONFLICT'
        });
    }

    const reservation = await FacilityReservation.create(buildGuestReservationPayload(reservationData));
    const populatedReservation = await populateReservation(
        FacilityReservation.findById(reservation._id)
    );

    res.status(201).json(populatedReservation);
});

exports.getMyFacilityReservations = asyncHandler(async (req, res) => {
    const resident = await Resident.findOne({ userId: req.user.id });

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found. Please complete your profile first.', {
            code: 'FACILITY_RESERVATION_RESIDENT_NOT_FOUND'
        });
    }

    const reservations = await populateReservation(
        FacilityReservation.find({ residentId: resident._id }).sort({ createdAt: -1 })
    );

    res.json(reservations);
});

exports.getFacilityAvailability = asyncHandler(async (req, res) => {
    const { facilityName, date } = req.query;

    if (!facilityName || !date) {
        throw createHttpError(400, 'facilityName and date are required', {
            code: 'FACILITY_RESERVATION_VALIDATION_ERROR'
        });
    }

    if (!isValidDate(date)) {
        throw createHttpError(400, 'Please provide a valid date', {
            code: 'FACILITY_RESERVATION_VALIDATION_ERROR'
        });
    }

    const { day, nextDay } = sameDayRange(date);
    const reservations = await FacilityReservation.find({
        facilityName,
        reservationDate: {
            $gte: day,
            $lt: nextDay
        },
        status: { $in: CONFLICT_STATUSES }
    }).sort({ startTime: 1 });

    res.json({
        facilityName,
        date,
        operatingHours: OPERATING_HOURS,
        reservedSlots: reservations.map((reservation) => ({
            id: reservation._id,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            status: reservation.status
        })),
        availableSlots: buildAvailableSlots(reservations)
    });
});

exports.getFacilityReservations = asyncHandler(async (req, res) => {
    const reservations = await populateReservation(
        FacilityReservation.find().sort({ createdAt: -1 })
    );

    res.json(reservations);
});

exports.getFacilityReservationById = asyncHandler(async (req, res) => {
    const reservation = await populateReservation(
        FacilityReservation.findById(req.params.id)
    );

    if (!reservation) {
        throw createHttpError(404, 'Facility reservation not found', {
            code: 'FACILITY_RESERVATION_NOT_FOUND'
        });
    }

    if (req.user.role === 'resident') {
        const resident = await Resident.findOne({ userId: req.user.id });

        if (!reservation.residentId || !resident || reservation.residentId._id.toString() !== resident._id.toString()) {
            throw createHttpError(403, 'Access denied', {
                code: 'FACILITY_RESERVATION_FORBIDDEN'
            });
        }
    }

    res.json(reservation);
});

exports.updateFacilityReservationStatus = asyncHandler(async (req, res) => {
    const statusData = pickFields(req.body, reservationStatusFields);

    if (!statusData.status) {
        throw createHttpError(400, 'status is required', {
            code: 'FACILITY_RESERVATION_VALIDATION_ERROR'
        });
    }

    const existingReservation = await FacilityReservation.findById(req.params.id);

    if (!existingReservation) {
        throw createHttpError(404, 'Facility reservation not found', {
            code: 'FACILITY_RESERVATION_NOT_FOUND'
        });
    }

    // Validate status transition
    if (!isValidTransition('facilityReservation', existingReservation.status, statusData.status)) {
        throw createHttpError(400, `Cannot transition from ${existingReservation.status} to ${statusData.status}`, {
            code: 'INVALID_STATUS_TRANSITION'
        });
    }

    const previousStatus = existingReservation.status;

    if (CONFLICT_STATUSES.includes(statusData.status)) {
        const conflictingReservation = await findConflictingReservation({
            facilityName: existingReservation.facilityName,
            reservationDate: existingReservation.reservationDate,
            startTime: existingReservation.startTime,
            endTime: existingReservation.endTime,
            excludeReservationId: existingReservation._id
        });

        if (conflictingReservation) {
            throw createHttpError(409, 'This facility is already reserved for the selected date and time.', {
                code: 'FACILITY_RESERVATION_CONFLICT'
            });
        }
    }

    const reservation = await FacilityReservation.findByIdAndUpdate(
        req.params.id,
        statusData,
        { new: true, runValidators: true }
    );

    // Log the status change
    try {
        await logStatusChange(
            'FacilityReservation',
            req.params.id,
            previousStatus,
            statusData.status,
            req.user,
            statusData.adminNotes || '',
            req.ip || req.connection.remoteAddress || ''
        );
    } catch (logError) {
        console.error('Failed to log status change:', logError);
    }

    const populatedReservation = await populateReservation(
        FacilityReservation.findById(reservation._id)
    );

    const recipientEmail = populatedReservation.email || populatedReservation.residentId?.email;

    if (recipientEmail) {
        await sendRequestStatusEmail(
            recipientEmail,
            getReservationRequesterName(populatedReservation),
            'facility reservation',
            statusData.status,
            statusData.adminNotes || ''
        );
    }

    res.json(populatedReservation);
});
