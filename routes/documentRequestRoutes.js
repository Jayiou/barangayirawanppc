const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    createDocumentRequest,
    getMyDocumentRequests,
    getDocumentRequests,
    getDocumentRequestById,
    updateDocumentRequestStatus
} = require('../controllers/documentRequestController');

router.post('/', authMiddleware, roleMiddleware('resident'), createDocumentRequest);
router.get('/me', authMiddleware, roleMiddleware('resident'), getMyDocumentRequests);
router.get('/:id', authMiddleware, getDocumentRequestById);
router.get('/', authMiddleware, roleMiddleware('admin'), getDocumentRequests);
router.patch('/:id/status', authMiddleware, roleMiddleware('admin'), updateDocumentRequestStatus);

module.exports = router;
