const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    createReport,
    getMyReports,
    getReports,
    getReportById,
    updateReportStatus
} = require('../controllers/reportController');

router.post('/', authMiddleware, roleMiddleware('resident'), createReport);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyReports);
router.get('/:id', authMiddleware, getReportById);
router.get('/', authMiddleware, roleMiddleware('admin'), getReports);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateReportStatus);

module.exports = router;
