const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { publicFacilityLimiter } = require('../middleware/rateLimitMiddleware');
const {
    createFacilityReservation,
    createPublicFacilityReservation,
    getMyFacilityReservations,
    getFacilityAvailability,
    getFacilityReservations,
    getFacilityReservationById,
    deleteMyFacilityReservation,
    updateFacilityReservationStatus
} = require('../controllers/facilityReservationController');

router.post('/', authMiddleware, roleMiddleware('resident'), createFacilityReservation);
router.post('/public', publicFacilityLimiter, createPublicFacilityReservation);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyFacilityReservations);
router.get('/availability', authMiddleware, getFacilityAvailability);
router.get('/:id', authMiddleware, getFacilityReservationById);
router.delete('/:id', authMiddleware, roleMiddleware('resident'), deleteMyFacilityReservation);
router.get('/', authMiddleware, roleMiddleware('admin'), getFacilityReservations);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateFacilityReservationStatus);

module.exports = router;
