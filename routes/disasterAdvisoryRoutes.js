const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    getAdminDisasterAdvisories,
    getPublicDisasterAdvisories,
    createDisasterAdvisory,
    updateDisasterAdvisory,
    deleteDisasterAdvisory
} = require('../controllers/disasterAdvisoryController');

const router = express.Router();

router.get('/public', getPublicDisasterAdvisories);
router.get('/', authMiddleware, roleMiddleware('admin'), getAdminDisasterAdvisories);
router.post('/', authMiddleware, roleMiddleware('admin'), createDisasterAdvisory);
router.patch('/:id', authMiddleware, roleMiddleware('admin'), updateDisasterAdvisory);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteDisasterAdvisory);

module.exports = router;
