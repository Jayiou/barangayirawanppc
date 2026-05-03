const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    createFacilityReservation,
    getMyFacilityReservations,
    getFacilityAvailability,
    getFacilityReservations,
    getFacilityReservationById,
    updateFacilityReservationStatus
} = require('../controllers/facilityReservationController');

router.post('/', authMiddleware, roleMiddleware('resident'), createFacilityReservation);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyFacilityReservations);
router.get('/availability', authMiddleware, getFacilityAvailability);
router.get('/:id', authMiddleware, getFacilityReservationById);
router.get('/', authMiddleware, roleMiddleware('admin'), getFacilityReservations);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateFacilityReservationStatus);

module.exports = router;
