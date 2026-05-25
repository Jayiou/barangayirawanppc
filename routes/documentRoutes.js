const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const documentController = require('../controllers/documentController');

// Resident creates a document request
router.post('/request', auth, documentController.createRequest);

// Resident lists their requests
router.get('/my', auth, documentController.getResidentRequests);

// Resident updates one of their pending requests
router.put('/:id', auth, documentController.updateRequest);

// Resident deletes one of their requests
router.delete('/:id', auth, documentController.deleteRequest);

// Get a single request (resident or admin)
router.get('/:id', auth, documentController.getRequestById);

module.exports = router;
