const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    createAnnouncement,
    deleteAnnouncement,
    getAllAnnouncements,
    getAnnouncements,
    getNextDisplayOrder,
    updateAnnouncement,
    updateDisplayOrder
} = require('../controllers/announcementController');

const router = express.Router();

router.get('/', getAnnouncements);
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), getAllAnnouncements);
router.get('/admin/next-order', authMiddleware, roleMiddleware('admin'), getNextDisplayOrder);
router.post('/', authMiddleware, roleMiddleware('admin'), upload.single('image'), createAnnouncement);
router.put('/:id', authMiddleware, roleMiddleware('admin'), upload.single('image'), updateAnnouncement);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteAnnouncement);
router.post('/admin/reorder', authMiddleware, roleMiddleware('admin'), updateDisplayOrder);

module.exports = router;
