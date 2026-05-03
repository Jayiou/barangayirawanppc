const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/barangay');
    console.log('Connected to MongoDB');

    // Delete existing admin for fresh setup
    await User.deleteOne({ username: 'admin' });

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create new admin
    const admin = new User({
      username: 'admin',
      email: 'admin@barangay.gov',
      password: hashedPassword,
      role: 'admin',
      accountStatus: 'approved',
      isActive: true
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
