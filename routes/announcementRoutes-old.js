const express = require('express');
const router = express.Router();
const fs = require('node:fs');
const path = require('node:path');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const logFile = path.join(__dirname, '../announcement-debug.log');

const {
    getAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    updateDisplayOrder
} = require('../controllers/announcementController');

// Public routes
router.get('/', getAnnouncements);

// Admin routes  
router.get('/admin/all', authMiddleware, getAllAnnouncements);

// Test route without Multer
router.post('/test', authMiddleware, asyncHandler(async (req, res) => {
    fs.appendFileSync(logFile, `[TEST ROUTE] Body: ${JSON.stringify(req.body)}\n`);
    res.json({ message: 'Test route works', body: req.body });
}));

// Normal routes with Multer
router.post('/', authMiddleware, (req, res, next) => {
    const timestamp = new Date().toISOString();
    
    // First, try to handle both FormData and JSON
    // If it's FormData, req.body will be empty and files will be in req.files
    // If it's JSON, req.body will have the fields
    
    // Log what we received
    const logMsg = `[${timestamp}] POST / Handler START\n` +
        `  Content-Type: ${req.headers['content-type']}\n` +
        `  Body: ${JSON.stringify(req.body)}\n` +
        `  Method: ${req.method}\n`;
    fs.appendFileSync(logFile, logMsg);
    
    // If content-type is multipart, process with Multer
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        fs.appendFileSync(logFile, `[${timestamp}] Detected multipart, using Multer\n`);
        
        upload.single('image')(req, res, (err) => {
            if (err) {
                fs.appendFileSync(logFile, `[${timestamp}] Multer error: ${err.message}\n`);
                return res.status(400).json({ success: false, message: `File error: ${err.message}` });
            }
            fs.appendFileSync(logFile, `[${timestamp}] Multer OK, calling controller\n`);
            createAnnouncement(req, res, next);
        });
    } else {
        // For non-multipart, just call the controller directly
        fs.appendFileSync(logFile, `[${timestamp}] Non-multipart request, calling controller\n`);
        createAnnouncement(req, res, next);
    }
});

router.put('/:id', authMiddleware, upload.single('image'), updateAnnouncement);
router.delete('/:id', authMiddleware, deleteAnnouncement);
router.post('/admin/reorder', authMiddleware, updateDisplayOrder);

module.exports = router;
