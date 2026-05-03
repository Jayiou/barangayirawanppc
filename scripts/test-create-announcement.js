require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const ann = new Announcement({
            title: 'Test Auto Order',
            description: 'Created by test script to verify displayOrder',
            startDate: new Date(),
            isActive: true,
            createdBy: new mongoose.Types.ObjectId()
        });

        await ann.save();
        console.log('Saved announcement id:', ann._id.toString());
        console.log('Assigned displayOrder:', ann.displayOrder);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();