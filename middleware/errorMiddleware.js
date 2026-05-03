const { HttpError } = require('../utils/httpError');
const fs = require('node:fs');
const path = require('node:path');

const errorHandler = (err, req, res, next) => {
    if (err?.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
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

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
