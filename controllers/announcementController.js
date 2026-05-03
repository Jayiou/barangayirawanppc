const asyncHandler = require('../utils/asyncHandler');
const createHttpError = require('../utils/httpError');
const Announcement = require('../models/Announcement');
const fs = require('node:fs');
const path = require('node:path');

const logFile = path.join(__dirname, '../announcement-debug.log');

// Get all active announcements
exports.getAnnouncements = asyncHandler(async (req, res) => {
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
});

// Get all announcements (admin only)
exports.getAllAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await Announcement.find()
        .populate('createdBy', 'username email')
        .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
        success: true,
        data: announcements
    });
});

// Create announcement
exports.createAnnouncement = asyncHandler(async (req, res) => {
    fs.appendFileSync(logFile, `\n[CONTROLLER CREATE] Received request\n`);
    fs.appendFileSync(logFile, `[CONTROLLER CREATE] Body: ${JSON.stringify(req.body)}\n`);
    fs.appendFileSync(logFile, `[CONTROLLER CREATE] File: ${req.file ? JSON.stringify({filename: req.file.filename, mimetype: req.file.mimetype}) : 'none'}\n`);
    fs.appendFileSync(logFile, `[CONTROLLER CREATE] User: ${req.user ? req.user._id : 'none'}\n`);

    const { title, description, startDate, endDate, isActive } = req.body;

    if (!title || !description) {
        fs.appendFileSync(logFile, `[CONTROLLER CREATE] ERROR: Missing title or description\n`);
        throw createHttpError(400, 'Title and description are required');
    }

    fs.appendFileSync(logFile, `[CONTROLLER CREATE] Validating dates\n`);

    // Auto-assign next displayOrder
    const nextOrder = await Announcement.getNextDisplayOrder();

    let startDateObj = new Date();
    if (startDate) {
        const parsedDate = new Date(startDate);
        if (!Number.isNaN(parsedDate.getTime())) {
            startDateObj = parsedDate;
        }
    }

    let endDateObj = null;
    if (endDate?.trim()) {

        const parsedDate = new Date(endDate);
        if (!Number.isNaN(parsedDate.getTime())) {
            endDateObj = parsedDate;
        }
    }

    const announcement = new Announcement({
        title,
        description,
        displayOrder: nextOrder,
        startDate: startDateObj,
        endDate: endDateObj,
        createdBy: req.user._id,
        isActive: isActive === 'true' || isActive === true || true
    });

    if (req.file) {
        announcement.imagePath = `/uploads/${req.file.filename}`;
    }

    fs.appendFileSync(logFile, `[CONTROLLER CREATE] Saving to database\n`);
    await announcement.save();
    fs.appendFileSync(logFile, `[CONTROLLER CREATE] Populating creator\n`);
    await announcement.populate('createdBy', 'username email');

    fs.appendFileSync(logFile, `[CONTROLLER CREATE] SUCCESS\n`);
    res.status(201).json({
        success: true,
        message: 'Announcement created successfully',
        data: announcement
    });
});

// Get next displayOrder (admin only)
exports.getNextDisplayOrder = asyncHandler(async (req, res) => {
    const nextOrder = await Announcement.getNextDisplayOrder();

    res.json({
        success: true,
        data: { nextDisplayOrder: nextOrder }
    });
});

// Update announcement
exports.updateAnnouncement = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, displayOrder, startDate, endDate, isActive } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
        throw createHttpError(404, 'Announcement not found');
    }

    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (displayOrder !== undefined) {
        const parsedOrder = Number.parseInt(displayOrder, 10);
        announcement.displayOrder = Number.isFinite(parsedOrder) && parsedOrder >= 1 ? parsedOrder : 1;
    }
    
    if (startDate) {
        const parsedDate = new Date(startDate);
        if (!Number.isNaN(parsedDate.getTime())) {
            announcement.startDate = parsedDate;
        }
    }

    if (endDate?.trim()) {
        const parsedDate = new Date(endDate);
        if (!Number.isNaN(parsedDate.getTime())) {
            announcement.endDate = parsedDate;
        }
    } else if (endDate === '' || endDate === null) {
        announcement.endDate = null;
    }

    // Convert string "true"/"false" to boolean
    if (isActive !== undefined) {
        announcement.isActive = isActive === 'true' || isActive === true;
    }

    if (req.file) {
        announcement.imagePath = `/uploads/${req.file.filename}`;
    }

    await announcement.save();
    await announcement.populate('createdBy', 'username email');

    res.json({
        success: true,
        message: 'Announcement updated successfully',
        data: announcement
    });
});

// Delete announcement
exports.deleteAnnouncement = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
        throw createHttpError(404, 'Announcement not found');
    }

    res.json({
        success: true,
        message: 'Announcement deleted successfully'
    });
});

// Update display order
exports.updateDisplayOrder = asyncHandler(async (req, res) => {
    const { announcements } = req.body;

    if (!Array.isArray(announcements)) {
        throw createHttpError(400, 'Announcements must be an array');
    }

    for (const item of announcements) {
        await Announcement.findByIdAndUpdate(item.id, { displayOrder: item.order });
    }

    res.json({
        success: true,
        message: 'Display order updated successfully'
    });
});
