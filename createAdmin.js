require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (adminExists) {
            console.log(`✅ Found existing admin account!`);
            const hashedPassword = await bcrypt.hash('admin12345', 10);
            adminExists.password = hashedPassword;
            adminExists.accountStatus = 'approved';
            adminExists.isActive = true;
            await adminExists.save();
            console.log(`Reset password to: admin12345`);
            console.log(`Username: ${adminExists.username}`);
            console.log(`Email: ${adminExists.email}`);
        } else {
            console.log('Creating default admin account...');
            const hashedPassword = await bcrypt.hash('admin12345', 10);
            
            await User.create({
                username: 'admin',
                email: 'admin@barangay.com',
                password: hashedPassword,
                role: 'admin',
                accountStatus: 'approved',
                isActive: true
            });
            
            console.log('✅ Default Admin created successfully!');
            console.log('-> Username: admin');
            console.log('-> Email: admin@barangay.com');
            console.log('-> Password: admin12345');
        }
    } catch (err) {
        console.error('Error creating admin:', err);
    } finally {
        mongoose.disconnect();
    }
}).catch(err => {
    console.error('MongoDB connection error:', err);
});
