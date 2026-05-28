const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { ensureDirectory, publicUploadDirectory, resolvePublicUploadFilePath } = require('../utils/uploadPaths');

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
router.post('/upload-sound', authMiddleware, roleMiddleware('admin'), upload.single('sound'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filename = path.basename(req.file.filename);
    const url = `/uploads/${encodeURI(filename)}`;

    res.json({ success: true, url });
});

router.post('/delete-sound', authMiddleware, roleMiddleware('admin'), (req, res) => {
    const deleted = deleteAdminSoundFile(req.body?.url || req.body?.fileUrl || req.body?.filename);
    if (!deleted) {
        return res.json({ success: true, deleted: false });
    }

    res.json({ success: true, deleted: true });
});

module.exports = router;
