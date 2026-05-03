const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function unlockAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/barangay');
        console.log('Connected to MongoDB');

        // Find and unlock admin
        const admin = await User.findOne({ username: 'admin' });
        
        if (!admin) {
            console.log('Admin user not found!');
            process.exit(1);
        }

        // Unlock the account
        admin.lockedUntil = null;
        admin.failedLoginAttempts = 0;
        await admin.save();

        console.log('Admin account unlocked!');
        console.log('You can now log in with:');
        console.log('- Username: admin');
        console.log('- Password: admin123');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

unlockAdmin();
