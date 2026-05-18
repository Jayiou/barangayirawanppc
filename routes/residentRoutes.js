const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const {
    createResident,
    getResidents,
    getResidentById,
    getMyResidentProfile,
    upsertMyResidentProfile,
    updateResident,
    updateResidentStatus,
    updateResidentVerification,
    sendResidentEmail,
    sendResidentSMS,
    adminResetResidentPassword,
    deleteResident,
    downloadResidentProof
} = require('../controllers/residentController');

router.get('/me', authMiddleware, roleMiddleware('resident'), getMyResidentProfile);
router.put('/me', authMiddleware, roleMiddleware('resident'), upsertMyResidentProfile);

router.post('/', authMiddleware, roleMiddleware('admin'), createResident);
router.get('/', authMiddleware, roleMiddleware('admin'), getResidents);
router.get('/:id/proof', authMiddleware, roleMiddleware('admin'), downloadResidentProof);
router.get('/:id', authMiddleware, roleMiddleware('admin'), getResidentById);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateResident);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateResidentStatus);
router.patch('/:id/verification', authMiddleware, roleMiddleware('admin'), updateResidentVerification);
router.post('/:id/send-email', authMiddleware, roleMiddleware('admin'), sendResidentEmail);
router.post('/:id/send-sms', authMiddleware, roleMiddleware('admin'), sendResidentSMS);
router.post('/:id/reset-password', authMiddleware, roleMiddleware('admin'), adminResetResidentPassword);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteResident);


module.exports = router;
