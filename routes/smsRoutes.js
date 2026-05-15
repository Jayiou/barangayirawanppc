const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getSMSLogs, getSMSLogStats } = require('../controllers/smsController');

router.get('/', authMiddleware, roleMiddleware('admin'), getSMSLogs);
router.get('/stats', authMiddleware, roleMiddleware('admin'), getSMSLogStats);

module.exports = router;
