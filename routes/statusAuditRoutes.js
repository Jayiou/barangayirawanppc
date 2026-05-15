const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getStatusHistory, getAuditLogs, getAuditStats } = require('../controllers/statusAuditController');

// View status history for a specific entity
router.get('/history/:entityType/:entityId', authMiddleware, getStatusHistory);

// View all audit logs (admin only)
router.get('/', authMiddleware, roleMiddleware('admin'), getAuditLogs);

// View audit statistics (admin only)
router.get('/stats', authMiddleware, roleMiddleware('admin'), getAuditStats);

module.exports = router;
