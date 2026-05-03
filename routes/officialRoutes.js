const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    createOfficial,
    getOfficials,
    getOfficialById,
    updateOfficial,
    deleteOfficial
} = require('../controllers/officialController');

router.get('/', authMiddleware, getOfficials);
router.get('/:id', authMiddleware, getOfficialById);

router.post('/', authMiddleware, roleMiddleware('admin'), createOfficial);
router.put('/:id', authMiddleware, roleMiddleware('admin'), updateOfficial);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteOfficial);

module.exports = router;
