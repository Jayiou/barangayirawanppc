const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { publicReportLimiter } = require('../middleware/rateLimitMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    createReport,
    createPublicReport,
    getMyReports,
    getReports,
    getReportById,
    updateReportStatus
} = require('../controllers/reportController');

router.post('/', authMiddleware, roleMiddleware('resident'), upload.array('proofFiles', 5), createReport);
router.post('/public', publicReportLimiter, createPublicReport);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyReports);
router.get('/:id', authMiddleware, getReportById);
router.get('/', authMiddleware, roleMiddleware('admin'), getReports);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateReportStatus);

module.exports = router;
