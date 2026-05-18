const path = require('node:path');
const fs = require('node:fs');

const publicUploadDirectory = path.resolve(__dirname, '../../uploads/public');
const legacyPublicUploadDirectory = path.resolve(__dirname, '../public/uploads');

const ensureDirectory = (directory) => {
    fs.mkdirSync(directory, { recursive: true });
};

const resolvePublicUploadFilePath = (filename) => {
    const safeFilename = path.basename(String(filename || '').split('?')[0].split('#')[0]);

    if (!safeFilename) {
        return '';
    }

    const preferredPath = path.join(publicUploadDirectory, safeFilename);
    if (fs.existsSync(preferredPath)) {
        return preferredPath;
    }

    const legacyPath = path.join(legacyPublicUploadDirectory, safeFilename);
    if (fs.existsSync(legacyPath)) {
        return legacyPath;
    }

    return preferredPath;
};

module.exports = {
    ensureDirectory,
    legacyPublicUploadDirectory,
    publicUploadDirectory,
    resolvePublicUploadFilePath
};