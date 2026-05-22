const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const documentController = require('../controllers/documentController');

// All admin routes require auth and role (allow officials and admin)
router.use(auth, role('admin', 'official'));

router.get('/', documentController.getAllRequests);
router.get('/:id', documentController.getRequestById);
router.put('/:id', documentController.adminEdit);
router.put('/:id/approve', documentController.approveRequest);
router.put('/:id/reject', documentController.rejectRequest);
router.get('/:id/generate', documentController.generateDocument);
router.post('/:id/generate', documentController.generateDocument);

module.exports = router;
