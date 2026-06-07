const path = require('node:path');
const fs = require('node:fs');

const publicUploadDirectory = path.resolve(
    process.env.PUBLIC_UPLOAD_DIR || path.resolve(__dirname, '../uploads/public')
);
const privateProofUploadDirectory = path.resolve(
    process.env.PRIVATE_PROOF_UPLOAD_DIR || path.resolve(__dirname, '../private/uploads/proofs')
);
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

const normalizePublicUploadUrl = (value) => {
    const rawValue = String(value || '').trim().replaceAll('\\', '/');

    if (!rawValue) {
        return '';
    }

    if (/^https?:\/\//i.test(rawValue) || rawValue.startsWith('data:') || rawValue.startsWith('blob:')) {
        return rawValue;
    }

    if (rawValue.startsWith('/uploads/')) {
        return rawValue;
    }

    if (rawValue.startsWith('uploads/')) {
        return `/${rawValue}`;
    }

    if (rawValue.startsWith('/public/uploads/')) {
        return rawValue.replace(/^\/public\//, '/');
    }

    if (rawValue.startsWith('public/uploads/')) {
        return `/${rawValue.replace(/^public\//, '')}`;
    }

    const filename = path.basename(rawValue.split('?')[0].split('#')[0]);
    return filename ? `/uploads/${encodeURI(filename)}` : '';
};

module.exports = {
    ensureDirectory,
    legacyPublicUploadDirectory,
    privateProofUploadDirectory,
    publicUploadDirectory,
    normalizePublicUploadUrl,
    resolvePublicUploadFilePath
};
