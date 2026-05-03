require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const resetAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const newPassword = 'Admin@123456'; // Change this to your desired password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await User.findOneAndUpdate(
            { role: 'admin' },
            { password: hashedPassword },
            { new: true }
        );

        if (result) {
            console.log(`✓ Admin password reset successfully!`);
            console.log(`✓ New password: ${newPassword}`);
            console.log(`✓ Username: ${result.username}`);
        } else {
            console.log('✗ No admin user found in database');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

resetAdminPassword();
