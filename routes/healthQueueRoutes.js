const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const controller = require('../controllers/healthQueueController');

// Joining the queue is available to authenticated residents only
router.post('/:eventId/join', authMiddleware, roleMiddleware('resident'), controller.joinQueue);
router.get('/:eventId', authMiddleware, controller.listQueue);
router.get('/:eventId/summary', authMiddleware, roleMiddleware('admin','bhw'), controller.getSummary);

// Calling next should be restricted to BHW or admin
router.post('/:eventId/call-next', authMiddleware, roleMiddleware('admin','bhw'), controller.callNext);
router.patch('/:eventId/:queueId/status', authMiddleware, roleMiddleware('admin','bhw'), controller.updateStatus);
router.patch('/:eventId/:queueId', authMiddleware, roleMiddleware('admin','bhw'), controller.updateQueueDetails);
router.delete('/:eventId/:queueId', authMiddleware, roleMiddleware('admin','bhw'), controller.deleteQueueEntry);

module.exports = router;
