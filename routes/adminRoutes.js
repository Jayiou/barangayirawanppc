const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const mailer = require('../utils/mailer');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { ensureDirectory, publicUploadDirectory, resolvePublicUploadFilePath } = require('../utils/uploadPaths');
const { persistPublicUpload } = require('../utils/publicUploadStorage');

const router = express.Router();

ensureDirectory(publicUploadDirectory);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, publicUploadDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'adminSound-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const audioFileFilter = (req, file, cb) => {
    const valid = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm'].includes(file.mimetype);
    if (valid) return cb(null, true);
    return cb(new Error('Invalid audio file type. Use MP3/OGG/WAV formats.'));
};

const resolveAdminSoundFilePath = (value) => {
    const filename = path.basename(String(value || '').trim().split('?')[0].split('#')[0]);
    if (!filename.startsWith('adminSound-')) {
        return '';
    }

    return resolvePublicUploadFilePath(filename);
};

const deleteAdminSoundFile = (value) => {
    const filePath = resolveAdminSoundFilePath(value);
    if (!filePath || !fs.existsSync(filePath)) {
        return false;
    }

    fs.unlinkSync(filePath);
    return true;
};

const upload = multer({
    storage,
    fileFilter: audioFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload a custom admin alert sound (admin-only)
router.post('/upload-sound', authMiddleware, roleMiddleware('admin'), upload.single('sound'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    try {
        await persistPublicUpload(req.file);
        const filename = path.basename(req.file.filename);
        const url = `/uploads/${encodeURI(filename)}`;

        res.json({ success: true, url });
    } catch (error) {
        next(error);
    }
});

router.post('/delete-sound', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const deleted = deleteAdminSoundFile(req.body?.url || req.body?.fileUrl || req.body?.filename);
    if (!deleted) {
        return res.json({ success: true, deleted: false });
    }

    res.json({ success: true, deleted: true });
});

// Admin creates a BHW account
router.post('/create-bhw', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email) {
            return res.status(400).json({ success: false, message: 'username and email are required' });
        }

        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Username or email already exists' });
        }

        const rawPassword = password || Math.random().toString(36).slice(-8);
        const hashed = await bcrypt.hash(rawPassword, 10);

        const user = new User({ username, email: String(email).toLowerCase(), password: hashed, role: 'bhw', accountStatus: 'approved', isActive: true });
        await user.save();

        // Send notification email to the new BHW (if configured)
        try {
            const loginLink = `${req.protocol}://${req.get('host')}/admin`;
            await mailer.sendStatusUpdateEmail(user.email, user.username, 'approved', { loginLink });
        } catch (err) {
            console.error('Failed to send BHW creation email:', err);
        }

        res.status(201).json({ success: true, message: 'BHW account created', data: { id: user._id, username: user.username, email: user.email, password: rawPassword } });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

