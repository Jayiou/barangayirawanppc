const { HttpError } = require('../utils/httpError');
const fs = require('node:fs');
const path = require('node:path');

const errorHandler = (err, req, res, next) => {
    if (err?.name === 'MulterError' && err?.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'Upload failed. Maximum file size is 10MB.'
        });
    }

    if (err?.name === 'CastError') {
        const castLog = `[${new Date().toISOString()}] CastError: ${err.message}\nPath: ${err.path}\nValue: ${JSON.stringify(err.value)}\nKind: ${err.kind}\nRequest: ${req.method} ${req.url}\nBody: ${JSON.stringify(req.body)}\n---\n`;
        fs.appendFileSync(path.join(__dirname, '../app-debug.log'), castLog);

        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    if (err?.name === 'ValidationError') {
        const validationLog = `[${new Date().toISOString()}] ValidationError: ${err.message}\nRequest: ${req.method} ${req.url}\nBody: ${JSON.stringify(req.body)}\n---\n`;
        fs.appendFileSync(path.join(__dirname, '../app-debug.log'), validationLog);
        
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Capture error in a log file for debugging
    const errorLog = `[${new Date().toISOString()}] ${err.stack || err}\nRequest: ${req.method} ${req.url}\nBody: ${JSON.stringify(req.body)}\n---\n`;
    fs.appendFileSync(path.join(__dirname, '../app-debug.log'), errorLog);

    // Don't log CORS errors to reduce noise (they're already handled)
    if (!err.message?.includes('Not allowed by CORS')) {
        console.error('SERVER ERROR CAUGHT:', err);
    }

    const statusCode = err.statusCode || (err instanceof HttpError && err.statusCode ? err.statusCode : 500);
    const response = {
        success: false,
        message: statusCode >= 500 ? 'Something went wrong on the server' : err.message
    };
    if (statusCode < 500 && err.fields) {
        response.fields = err.fields;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
