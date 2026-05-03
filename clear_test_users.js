require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const User = require('./models/User');
        const Resident = require('./models/Resident');

        const users = await User.deleteMany({ role: { $ne: 'admin' } });
        const residents = await Resident.deleteMany({});
        
        console.log(`Deleted ${users.deletedCount} test users.`);
        console.log(`Deleted ${residents.deletedCount} test resident profiles.`);
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();