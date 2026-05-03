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
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteResident);


module.exports = router;
