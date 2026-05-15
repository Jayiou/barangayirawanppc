const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const Announcement = require('../models/Announcement');

// Get all active announcements (public)
router.get('/', asyncHandler(async (req, res) => {
    const announcements = await Announcement.find({
        isActive: true,
        startDate: { $lte: new Date() },
        $or: [
            { endDate: { $gte: new Date() } },
            { endDate: { $exists: false } }
        ]
    })
    .sort({ displayOrder: 1, createdAt: -1 })
    .select('-createdBy');

    res.json({
        success: true,
        data: announcements
    });
}));

// Get all announcements (admin only)
router.get('/admin/all', authMiddleware, roleMiddleware('admin'), asyncHandler(async (req, res) => {
    const announcements = await Announcement.find()
        .populate('createdBy', 'username email')
        .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
        success: true,
        data: announcements
    });
}));

// Admin helper: next display order
router.get('/admin/next-order', authMiddleware, roleMiddleware('admin'), asyncHandler(async (req, res) => {
    // Use model helper to compute next numeric order
    const nextOrder = await Announcement.getNextDisplayOrder();

    res.json({ success: true, data: { nextDisplayOrder: nextOrder } });
}));

// Create announcement (admin only, with optional file upload)
router.post('/', authMiddleware, roleMiddleware('admin'), upload.single('image'), asyncHandler(async (req, res) => {
    const { title, description, startDate, endDate, isActive } = req.body;

    if (!title || !description) {
        throw createHttpError(400, 'Title and description are required');
    }

    if (!startDate) {
        throw createHttpError(400, 'Start date is required');
    }

    // Auto-assign next displayOrder
    const nextOrder = await Announcement.getNextDisplayOrder();

    // Parse dates
    let startDateObj = new Date(startDate);
    if (Number.isNaN(startDateObj.getTime())) {
        throw createHttpError(400, 'Invalid start date format');
    }

    let endDateObj = null;
    if (endDate && endDate.toString().trim() !== '') {
        endDateObj = new Date(endDate);
        if (Number.isNaN(endDateObj.getTime())) {
            endDateObj = null; // Ignore invalid end date
        }
    }

    // Create announcement
    const announcement = new Announcement({
        title: title.trim(),
        description: description.trim(),
        displayOrder: nextOrder,
        startDate: startDateObj,
        endDate: endDateObj,
        createdBy: req.user.id,
        isActive: isActive === 'true' || isActive === true
    });

    // Add image path if file was uploaded
    if (req.file) {
        announcement.imagePath = `/uploads/${req.file.filename}`;
    }

    await announcement.save();
    await announcement.populate('createdBy', 'username email');

    res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: announcement
    });
}));

const applyAnnouncementUpdates = (announcement, body, file) => {
    const { title, description, displayOrder, startDate, endDate, isActive } = body;

    if (title) announcement.title = title.trim();
    if (description) announcement.description = description.trim();
    if (displayOrder !== undefined) {
        const parsedOrder = Number.parseInt(displayOrder, 10);
        announcement.displayOrder = Number.isFinite(parsedOrder) && parsedOrder >= 1 ? parsedOrder : 1;
    }
    if (startDate) {
        const parsed = new Date(startDate);
        if (!Number.isNaN(parsed.getTime())) announcement.startDate = parsed;
    }
    if (endDate && endDate.toString().trim() !== '') {
        const parsed = new Date(endDate);
        if (!Number.isNaN(parsed.getTime())) announcement.endDate = parsed;
    } else if (endDate === '' || endDate === null) {
        announcement.endDate = null;
    }
    if (isActive !== undefined) announcement.isActive = isActive === 'true' || isActive === true;
    if (file) announcement.imagePath = `/uploads/${file.filename}`;
};

// Update announcement (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), upload.single('image'), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
        throw createHttpError(404, 'Announcement not found');
    }

    applyAnnouncementUpdates(announcement, req.body, req.file);

    await announcement.save();
    await announcement.populate('createdBy', 'username email');

    res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: announcement
    });
}));

// Delete announcement (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
        throw createHttpError(404, 'Announcement not found');
    }

    res.json({
        success: true,
        message: 'Announcement deleted successfully'
    });
}));

// Update display order (admin only)
router.post('/admin/reorder', authMiddleware, roleMiddleware('admin'), asyncHandler(async (req, res) => {
    const { announcements } = req.body;
    
    if (!Array.isArray(announcements)) {
        throw createHttpError(400, 'Announcements array is required');
    }

    // Update display order for each announcement
    for (const { id, displayOrder } of announcements) {
        await Announcement.findByIdAndUpdate(id, { displayOrder });
    }

    res.json({
        success: true,
        message: 'Display order updated successfully'
    });
}));

module.exports = router;
