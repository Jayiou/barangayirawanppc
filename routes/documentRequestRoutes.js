const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { publicDocumentRequestLimiter } = require('../middleware/rateLimitMiddleware');
const {
    createDocumentRequest,
    createPublicDocumentRequest,
    getMyDocumentRequests,
    getDocumentRequests,
    getDocumentRequestById,
    updateDocumentRequestStatus,
    sendDocumentToResident,
    previewDocument
} = require('../controllers/documentRequestController');

router.post('/public', publicDocumentRequestLimiter, createPublicDocumentRequest);
router.post('/', authMiddleware, roleMiddleware('resident'), createDocumentRequest);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyDocumentRequests);
router.get('/:id', authMiddleware, getDocumentRequestById);
router.get('/:id/preview-document', authMiddleware, roleMiddleware('admin'), previewDocument);
router.get('/', authMiddleware, roleMiddleware('admin'), getDocumentRequests);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateDocumentRequestStatus);
router.post('/:id/send-to-resident', authMiddleware, roleMiddleware('admin'), sendDocumentToResident);

module.exports = router;
