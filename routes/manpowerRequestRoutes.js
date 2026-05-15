const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { publicReportLimiter } = require('../middleware/rateLimitMiddleware');
const {
    createRequest,
    createPublicRequest,
    getMyRequests,
    getRequests,
    getRequestById,
    updateRequestStatus
} = require('../controllers/manpowerRequestController');

router.post('/', authMiddleware, roleMiddleware('resident'), createRequest);
router.post('/public', publicReportLimiter, createPublicRequest);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyRequests);
router.get('/:id', authMiddleware, getRequestById);
router.get('/', authMiddleware, roleMiddleware('admin'), getRequests);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateRequestStatus);

module.exports = router;
