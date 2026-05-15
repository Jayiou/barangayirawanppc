const Appointment = require('../models/Appointment');
const BlockedSchedule = require('../models/BlockedSchedule');
const Official = require('../models/Official');

/**
 * Default time slots available during office hours
 * (excluding lunch break which is 12:00 PM - 1:00 PM)
 */
const DEFAULT_TIME_SLOTS = [
    { startTime: '08:00', endTime: '09:00', label: '8:00 AM to 9:00 AM' },
    { startTime: '09:00', endTime: '10:00', label: '9:00 AM to 10:00 AM' },
    { startTime: '10:00', endTime: '11:00', label: '10:00 AM to 11:00 AM' },
    { startTime: '11:00', endTime: '12:00', label: '11:00 AM to 12:00 PM' },
    { startTime: '13:00', endTime: '14:00', label: '1:00 PM to 2:00 PM' },
    { startTime: '14:00', endTime: '15:00', label: '2:00 PM to 3:00 PM' },
    { startTime: '15:00', endTime: '16:00', label: '3:00 PM to 4:00 PM' },
    { startTime: '16:00', endTime: '17:00', label: '4:00 PM to 5:00 PM' }
];

const formatYMD = (date) => {
    return (
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0')
    );
};

/**
 * Check if time is within lunch break
 */
const isLunchBreakTime = (startTime, endTime, lunchBreakStart = '12:00', lunchBreakEnd = '13:00') => {
    // Check if the slot overlaps with lunch break
    return startTime < lunchBreakEnd && endTime > lunchBreakStart;
};

/**
 * Check if time slot is within office hours
 */
const isWithinOfficeHours = (startTime, endTime, officeStart = '08:00', officeEnd = '17:00') => {
    return startTime >= officeStart && endTime <= officeEnd;
};

/**
 * Parse time string (HH:mm) to minutes for easier comparison
 */
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Check if two time slots overlap
 */
const doTimesOverlap = (start1, end1, start2, end2) => {
    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    return start1Min < end2Min && end1Min > start2Min;
};

/**
 * Get all available time slots for a specific official on a specific date
 */
const getAvailableTimeSlots = async (officialId, appointmentDate) => {
    // Determine raw YYYY-MM-DD from user input
    let appointmentYMD;
    if (typeof appointmentDate === 'string' && appointmentDate.includes('T')) {
        appointmentYMD = appointmentDate.split('T')[0];
    } else if (typeof appointmentDate === 'string' && appointmentDate.length >= 10) {
        appointmentYMD = appointmentDate.substring(0, 10);
    } else {
        appointmentYMD = formatYMD(new Date(appointmentDate));
    }

    const dateOnly = new Date(`${appointmentYMD}T00:00:00`);
    const endOfDay = new Date(`${appointmentYMD}T23:59:59`);

    // Get official details
    const official = await Official.findById(officialId);
    if (!official) {
        throw new Error('Official not found');
    }

    const {
        officeHours: {
            startTime: officeStart,
            endTime: officeEnd,
            lunchBreakStart,
            lunchBreakEnd
        }
    } = official;

    // Get all booked appointments (excluding rejected, cancelled, expired)
    const bookedAppointments = await Appointment.find({
        officialId,
        appointmentDate: {
            $gte: dateOnly,
            $lte: endOfDay
        },
        status: { $in: ['pending', 'approved', 'completed'] }
    });

    // Get all blocked schedules for this date
    const blockedSchedules = await BlockedSchedule.find({
        officialId,
        blockedDate: {
            $gte: dateOnly,
            $lte: endOfDay
        }
    });

    const now = new Date();
    const todayYMD = formatYMD(now);
    
    // If the date is entirely in the past, return NO slots
    if (appointmentYMD < todayYMD) {
        return [];
    }

    const isToday = appointmentYMD === todayYMD;
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Filter available slots
    const availableSlots = DEFAULT_TIME_SLOTS.map((slot) => {
        let isAvailable = true;
        let reason = '';

        // If the appointment is today, filter out past time slots based on start time
        if (isToday && slot.startTime <= currentTimeStr) {
            isAvailable = false;
            reason = 'Past time';
        }

        // Check if within office hours
        else if (!isWithinOfficeHours(slot.startTime, slot.endTime, officeStart, officeEnd)) {
            isAvailable = false;
            reason = 'Outside office hours';
        }

        // Check if overlaps with lunch break
        else if (isLunchBreakTime(slot.startTime, slot.endTime, lunchBreakStart, lunchBreakEnd)) {
            isAvailable = false;
            reason = 'Lunch break';
        }

        if (isAvailable) {
            // Check if overlaps with any booked appointment
            const hasConflict = bookedAppointments.some((appt) =>
                doTimesOverlap(
                    slot.startTime,
                    slot.endTime,
                    appt.timeSlot.startTime,
                    appt.timeSlot.endTime
                )
            );

            if (hasConflict) {
                isAvailable = false;
                reason = 'Already booked';
            }
        }

        if (isAvailable) {
            // Check if blocked
            const isBlocked = blockedSchedules.some((blocked) =>
                doTimesOverlap(
                    slot.startTime,
                    slot.endTime,
                    blocked.startTime,
                    blocked.endTime
                )
            );

            if (isBlocked) {
                isAvailable = false;
                reason = 'Blocked schedule';
            }
        }

        return {
            ...slot,
            isAvailable,
            reason
        };
    });

    return availableSlots;
};

/**
 * Check if a resident has an active appointment
 * Active = pending or approved
 */
const hasActiveAppointment = async (residentId) => {
    const activeAppointment = await Appointment.findOne({
        residentId,
        status: { $in: ['pending', 'approved'] }
    });

    return !!activeAppointment;
};

/**
 * Check if a specific time slot is available for an official on a date
 */
const isTimeSlotAvailable = async (officialId, appointmentDate, startTime, endTime) => {
    // Determine raw YYYY-MM-DD from user input
    let appointmentYMD;
    if (typeof appointmentDate === 'string' && appointmentDate.includes('T')) {
        appointmentYMD = appointmentDate.split('T')[0];
    } else if (typeof appointmentDate === 'string' && appointmentDate.length >= 10) {
        appointmentYMD = appointmentDate.substring(0, 10);
    } else {
        appointmentYMD = formatYMD(new Date(appointmentDate));
    }

    const dateOnly = new Date(`${appointmentYMD}T00:00:00`);
    const endOfDay = new Date(`${appointmentYMD}T23:59:59`);

    // Get official details
    const official = await Official.findById(officialId);
    if (!official) {
        throw new Error('Official not found');
    }

    const {
        officeHours: {
            startTime: officeStart,
            endTime: officeEnd,
            lunchBreakStart,
            lunchBreakEnd
        }
    } = official;

    // Check if the slot is in the past for today
    const now = new Date();
    const todayYMD = formatYMD(now);
    const isToday = appointmentYMD === todayYMD;
    const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (appointmentYMD < todayYMD || (isToday && startTime <= currentTimeStr)) {
        return { available: false, reason: 'Cannot book an appointment in the past' };
    }

    // Check office hours
    if (!isWithinOfficeHours(startTime, endTime, officeStart, officeEnd)) {
        return { available: false, reason: 'Time slot is outside office hours' };
    }

    // Check lunch break
    if (isLunchBreakTime(startTime, endTime, lunchBreakStart, lunchBreakEnd)) {
        return { available: false, reason: 'Lunch break is from 12:00 PM to 1:00 PM' };
    }

    // Check booked appointments
    const conflictingAppointment = await Appointment.findOne({
        officialId,
        appointmentDate: {
            $gte: dateOnly,
            $lte: endOfDay
        },
        $or: [
            {
                'timeSlot.startTime': { $lt: endTime },
                'timeSlot.endTime': { $gt: startTime }
            }
        ],
        status: { $in: ['pending', 'approved', 'completed'] }
    });

    if (conflictingAppointment) {
        return { available: false, reason: 'Time slot is already booked' };
    }

    // Check blocked schedules
    const blockedSchedule = await BlockedSchedule.findOne({
        officialId,
        blockedDate: {
            $gte: dateOnly,
            $lte: endOfDay
        },
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
    });

    if (blockedSchedule) {
        return { available: false, reason: `Schedule is blocked: ${blockedSchedule.reason || blockedSchedule.note}` };
    }

    return { available: true };
};

/**
 * Validate appointment date (must be future date, minimum days ahead)
 */
const isValidAppointmentDate = (appointmentDate, minDaysAhead = 1) => {
    let appointmentYMD;
    if (typeof appointmentDate === 'string' && appointmentDate.includes('T')) {
        appointmentYMD = appointmentDate.split('T')[0];
    } else if (typeof appointmentDate === 'string' && appointmentDate.length >= 10) {
        appointmentYMD = appointmentDate.substring(0, 10);
    } else {
        appointmentYMD = formatYMD(new Date(appointmentDate));
    }

    const selectedDate = new Date(`${appointmentYMD}T00:00:00`);

    const today = new Date();
    const todayYMD = formatYMD(today);
    const minDate = new Date(`${todayYMD}T00:00:00`);
    minDate.setDate(minDate.getDate() + minDaysAhead);

    return selectedDate >= minDate;
};

/**
 * Format appointment details for response
 */
const formatAppointmentResponse = (appointment) => {
    return {
        _id: appointment._id,
        residentId: appointment.residentId,
        officialId: appointment.officialId,
        appointmentDate: appointment.appointmentDate,
        timeSlot: appointment.timeSlot,
        purpose: appointment.purpose,
        status: appointment.status,
        remarks: appointment.remarks,
        rejectionReason: appointment.rejectionReason,
        cancellationReason: appointment.cancellationReason,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        approvedAt: appointment.approvedAt,
        rejectedAt: appointment.rejectedAt,
        cancelledAt: appointment.cancelledAt,
        completedAt: appointment.completedAt
    };
};

/**
 * Check if an appointment has expired (pending for too long)
 * Default: 24 hours
 */
const hasAppointmentExpired = (appointment, expirationHours = 24) => {
    if (appointment.status !== 'pending') {
        return false;
    }

    const createdTime = new Date(appointment.createdAt).getTime();
    const currentTime = new Date().getTime();
    const timeDiffHours = (currentTime - createdTime) / (1000 * 60 * 60);

    return timeDiffHours >= expirationHours;
};

/**
 * Automatically expire old pending appointments
 */
const expireOldPendingAppointments = async (expirationHours = 24) => {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - expirationHours);

    const result = await Appointment.updateMany(
        {
            status: 'pending',
            createdAt: { $lt: cutoffTime }
        },
        {
            status: 'expired',
            expiredAt: new Date(),
            updatedAt: new Date()
        }
    );

    return result;
};

module.exports = {
    DEFAULT_TIME_SLOTS,
    isLunchBreakTime,
    isWithinOfficeHours,
    timeToMinutes,
    doTimesOverlap,
    getAvailableTimeSlots,
    hasActiveAppointment,
    isTimeSlotAvailable,
    isValidAppointmentDate,
    formatAppointmentResponse,
    hasAppointmentExpired,
    expireOldPendingAppointments
};
