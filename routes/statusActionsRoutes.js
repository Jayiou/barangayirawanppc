const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    // Facility reservation actions
    approveFacilityReservation,
    rejectFacilityReservation,
    completeFacilityReservation,
    // Document request actions
    approveDocumentRequest,
    rejectDocumentRequest,
    processDocumentRequest,
    readyDocumentRequest,
    completeDocumentRequest,
    // Report actions
    startReviewReport,
    startProgressReport,
    resolveReport,
    rejectReport
} = require('../controllers/statusActionsController');

// ============ FACILITY RESERVATION ACTIONS ============
router.post('/reservations/:id/approve', authMiddleware, roleMiddleware('admin'), approveFacilityReservation);
router.post('/reservations/:id/reject', authMiddleware, roleMiddleware('admin'), rejectFacilityReservation);
router.post('/reservations/:id/complete', authMiddleware, roleMiddleware('admin'), completeFacilityReservation);

// ============ DOCUMENT REQUEST ACTIONS ============
router.post('/documents/:id/approve', authMiddleware, roleMiddleware('admin'), approveDocumentRequest);
router.post('/documents/:id/reject', authMiddleware, roleMiddleware('admin'), rejectDocumentRequest);
router.post('/documents/:id/processing', authMiddleware, roleMiddleware('admin'), processDocumentRequest);
router.post('/documents/:id/ready-pickup', authMiddleware, roleMiddleware('admin'), readyDocumentRequest);
router.post('/documents/:id/complete', authMiddleware, roleMiddleware('admin'), completeDocumentRequest);

// ============ REPORT ACTIONS ============
router.post('/reports/:id/reviewing', authMiddleware, roleMiddleware('admin'), startReviewReport);
router.post('/reports/:id/progress', authMiddleware, roleMiddleware('admin'), startProgressReport);
router.post('/reports/:id/resolve', authMiddleware, roleMiddleware('admin'), resolveReport);
router.post('/reports/:id/reject', authMiddleware, roleMiddleware('admin'), rejectReport);

module.exports = router;
