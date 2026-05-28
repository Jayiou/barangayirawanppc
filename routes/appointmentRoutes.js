const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const {
    // Officials
    getAllOfficials,
    getOfficial,
    createOfficial,
    updateOfficial,
    deleteOfficial,
    // Blocked Schedules
    getBlockedSchedules,
    createBlockedSchedule,
    updateBlockedSchedule,
    deleteBlockedSchedule,
    // Resident Appointments
    getAvailableSlots,
    requestAppointment,
    requestPublicAppointment,
    getMyAppointments,
    getAppointmentDetail,
    cancelAppointment,
    deleteMyAppointment,
    // Admin Appointments
    getAllAppointments,
    approveAppointment,
    rejectAppointment,
    completeAppointment,
    adminCancelAppointment
} = require('../controllers/appointmentController');

// Rate limiters
const appointmentLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 appointment requests per hour
    scope: 'appointments:request',
    message: 'Too many appointment requests. Please try again later.'
});

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * Get all officials (public - no auth required)
 */
router.get('/officials', getAllOfficials);

/**
 * Get single official (public)
 */
router.get('/officials/:id', getOfficial);

/**
 * Get available time slots for public appointment requests
 * Query: officialId, appointmentDate
 */
router.get('/available-slots/public', getAvailableSlots);

/**
 * Request appointment without resident registration
 */
router.post('/request/public', appointmentLimiter, requestPublicAppointment);

// ============================================
// RESIDENT ROUTES
// ============================================

/**
 * Get available time slots for an official
 * Query: officialId, appointmentDate
 */
router.get('/available-slots', authMiddleware, getAvailableSlots);

/**
 * Request appointment
 */
router.post('/request', authMiddleware, appointmentLimiter, requestAppointment);

/**
 * Get resident's appointments
 */
router.get('/my-appointments', authMiddleware, getMyAppointments);

/**
 * Get appointment details
 */
router.get('/:id', authMiddleware, getAppointmentDetail);

/**
 * Cancel appointment (resident)
 */
router.put('/:id/cancel', authMiddleware, cancelAppointment);

/**
 * Delete appointment from resident history after terminal state
 */
router.delete('/:id', authMiddleware, deleteMyAppointment);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * Admin: Get all appointments
 */
router.get(
    '/admin/all-appointments',
    authMiddleware,
    roleMiddleware('admin'),
    getAllAppointments
);

/**
 * Admin: Approve appointment
 */
router.put(
    '/:id/approve',
    authMiddleware,
    roleMiddleware('admin'),
    approveAppointment
);

/**
 * Admin: Reject appointment
 */
router.put(
    '/:id/reject',
    authMiddleware,
    roleMiddleware('admin'),
    rejectAppointment
);

/**
 * Admin: Mark appointment as completed
 */
router.put(
    '/:id/complete',
    authMiddleware,
    roleMiddleware('admin'),
    completeAppointment
);

/**
 * Admin: Cancel appointment
 */
router.put(
    '/:id/admin-cancel',
    authMiddleware,
    roleMiddleware('admin'),
    adminCancelAppointment
);

/**
 * Admin: Create official
 */
router.post(
    '/officials',
    authMiddleware,
    roleMiddleware('admin'),
    upload.single('picture'),
    createOfficial
);

/**
 * Admin: Update official
 */
router.put(
    '/officials/:id',
    authMiddleware,
    roleMiddleware('admin'),
    upload.single('picture'),
    updateOfficial
);

/**
 * Admin: Delete official
 */
router.delete(
    '/officials/:id',
    authMiddleware,
    roleMiddleware('admin'),
    deleteOfficial
);

/**
 * Admin: Get blocked schedules for an official
 */
router.get(
    '/officials/:officialId/blocked-schedules',
    authMiddleware,
    roleMiddleware('admin'),
    getBlockedSchedules
);

/**
 * Admin: Create blocked schedule
 */
router.post(
    '/blocked-schedules',
    authMiddleware,
    roleMiddleware('admin'),
    createBlockedSchedule
);

/**
 * Admin: Update blocked schedule
 */
router.put(
    '/blocked-schedules/:id',
    authMiddleware,
    roleMiddleware('admin'),
    updateBlockedSchedule
);

/**
 * Admin: Delete blocked schedule
 */
router.delete(
    '/blocked-schedules/:id',
    authMiddleware,
    roleMiddleware('admin'),
    deleteBlockedSchedule
);

module.exports = router;
