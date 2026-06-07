const fs = require('node:fs/promises');
const path = require('node:path');
const s3 = require('./s3');

const getPublicUploadKey = (filename) => `public/${path.basename(String(filename || ''))}`;

const isS3Configured = () => typeof s3.isConfigured === 'function' ? s3.isConfigured() : Boolean(process.env.S3_BUCKET);

const persistPublicUpload = async (file) => {
    if (!file?.filename || !isS3Configured()) {
        return;
    }

    const buffer = await fs.readFile(file.path);
    await s3.uploadBuffer(getPublicUploadKey(file.filename), buffer, file.mimetype || 'application/octet-stream');
};

const persistPublicUploads = async (files = []) => {
    await Promise.all((Array.isArray(files) ? files : []).map(persistPublicUpload));
};

module.exports = {
    getPublicUploadKey,
    persistPublicUpload,
    persistPublicUploads
};
