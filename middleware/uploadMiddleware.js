const multer = require('multer');
const path = require('node:path');
const { ensureDirectory, publicUploadDirectory } = require('../utils/uploadPaths');

const privateProofDirectory = path.join(__dirname, '../private/uploads/proofs/');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destination = file.fieldname === 'proofOfResidency'
            ? privateProofDirectory
            : publicUploadDirectory;

        ensureDirectory(destination);
        cb(null, destination);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const validMimes = file.fieldname === 'proofOfResidency'
        ? ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        : ['image/jpeg', 'image/png', 'image/jpg'];

    if (validMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB max
    }
});

module.exports = upload;
