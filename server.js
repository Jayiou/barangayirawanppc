const connectDB = require('./config/db');
const app = require('./app');
const { closeBrowser } = require('./utils/documentGenerator');
const s3 = require('./utils/s3');
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    if (process.env.NODE_ENV === 'production' && !s3.isConfigured()) {
        console.warn(
            '[UPLOAD STORAGE] S3_BUCKET is not configured. Uploaded images and files are stored ' +
            'on the local container and will be lost after a Render redeploy unless /app/uploads ' +
            'is backed by a Render Persistent Disk.'
        );
    }

    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown handler for Puppeteer browser
    const shutdown = async () => {
        console.log('Server shutting down...');
        await closeBrowser();
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    };

    // Handle termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
