const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    createAppointment,
    getMyAppointments,
    getAppointments,
    getAppointmentById,
    updateAppointmentStatus
} = require('../controllers/appointmentController');

router.post('/', authMiddleware, roleMiddleware('resident'), createAppointment);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyAppointments);
router.get('/:id', authMiddleware, getAppointmentById);
router.get('/', authMiddleware, roleMiddleware('admin'), getAppointments);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateAppointmentStatus);

module.exports = router;
