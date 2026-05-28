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
    deleteMyReport,
    updateReportStatus
} = require('../controllers/reportController');

router.post('/', authMiddleware, roleMiddleware('resident'), upload.array('proofFiles', 5), createReport);
router.post('/public', publicReportLimiter, upload.array('proofFiles', 5), createPublicReport);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyReports);
router.get('/:id', authMiddleware, getReportById);
router.delete('/:id', authMiddleware, roleMiddleware('resident', 'admin'), deleteMyReport);
router.get('/', authMiddleware, roleMiddleware('admin'), getReports);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateReportStatus);

module.exports = router;
