const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const controller = require('../controllers/healthQueueController');

// Joining the queue is available to authenticated users (residents/guests may be allowed)
router.post('/:eventId/join', authMiddleware, controller.joinQueue);
router.get('/:eventId', authMiddleware, controller.listQueue);

// Calling next should be restricted to BHW or admin
router.post('/:eventId/call-next', authMiddleware, roleMiddleware('admin','bhw'), controller.callNext);

module.exports = router;
