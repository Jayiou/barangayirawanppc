const connectDB = require('./config/db');
const app = require('./app');
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    return app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
