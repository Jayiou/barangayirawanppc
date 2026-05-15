const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
    createBlotter,
    getBlotters,
    getBlotterById,
    updateBlotter,
    deleteBlotter
} = require('../controllers/blotterController');

// Admin only routes
router.post('/', authMiddleware, roleMiddleware('admin'), createBlotter);
router.get('/', authMiddleware, roleMiddleware('admin'), getBlotters);
router.get('/:id', authMiddleware, roleMiddleware('admin'), getBlotterById);
router.patch('/:id', authMiddleware, roleMiddleware('admin'), updateBlotter);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteBlotter);

module.exports = router;
