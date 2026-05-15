const mongoose = require('../config/mongoose');

const officialSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        position: {
            type: String,
            required: true,
            enum: [
                'Barangay Captain',
                'Barangay Secretary',
                'Barangay Treasurer',
                'Barangay Kagawad',
                'Other'
            ],
            default: 'Other'
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },
        contactNumber: {
            type: String,
            trim: true,
            default: ''
        },
        picture: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        officeHours: {
            startTime: {
                type: String,
                default: '08:00' // 8:00 AM
            },
            endTime: {
                type: String,
                default: '17:00' // 5:00 PM
            },
            lunchBreakStart: {
                type: String,
                default: '12:00' // 12:00 PM
            },
            lunchBreakEnd: {
                type: String,
                default: '13:00' // 1:00 PM
            }
        },
        notes: {
            type: String,
            trim: true,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Official', officialSchema);
