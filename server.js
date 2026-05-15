const connectDB = require('./config/db');
const app = require('./app');
const { closeBrowser } = require('./utils/documentGenerator');
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

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
