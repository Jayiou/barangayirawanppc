const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/barangay');
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ username: 'admin' });
    if (admin) {
      console.log('✓ Admin user found:');
      console.log('  Username:', admin.username);
      console.log('  Email:', admin.email);
      console.log('  Role:', admin.role);
      console.log('  Active:', admin.isActive);
      console.log('  Status:', admin.accountStatus);
      console.log('  Password hash exists:', !!admin.password);
    } else {
      console.log('✗ Admin user not found');
      const allUsers = await User.find({});
      console.log('Total users in DB:', allUsers.length);
      allUsers.forEach(u => console.log(`  - ${u.username} (${u.role})`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAdminUser();
