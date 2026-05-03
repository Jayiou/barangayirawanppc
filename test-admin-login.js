const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/barangay');
        console.log('Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ username: 'admin' });
        
        if (!admin) {
            console.log('Admin user not found in database!');
            process.exit(1);
        }

        console.log('Admin user found:');
        console.log('- Username:', admin.username);
        console.log('- Email:', admin.email);
        console.log('- Role:', admin.role);
        console.log('- Account Status:', admin.accountStatus);
        console.log('- Is Active:', admin.isActive);
        console.log('- Password Hash:', admin.password.substring(0, 20) + '...');
        
        // Test password comparison
        const testPassword = 'admin123';
        const match = await bcrypt.compare(testPassword, admin.password);
        console.log('\nPassword comparison test:');
        console.log('- Testing password:', testPassword);
        console.log('- Match result:', match);

        if (!match) {
            console.log('\nPassword does not match! Creating a new admin with the correct password...');
            // Rehash the password
            const newHash = await bcrypt.hash(testPassword, 10);
            admin.password = newHash;
            await admin.save();
            console.log('Admin password updated!');
            
            // Test again
            const match2 = await bcrypt.compare(testPassword, admin.password);
            console.log('Re-test result:', match2);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testLogin();
