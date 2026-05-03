const mongoose = require('../config/mongoose');

const officialSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        position: {
            type: String,
            required: true,
            trim: true
        },
        contactNumber: {
            type: String,
            trim: true,
            default: ''
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },
        officeDays: {
            type: [String],
            default: []
        },
        officeStartTime: {
            type: String,
            trim: true,
            default: ''
        },
        officeEndTime: {
            type: String,
            trim: true,
            default: ''
        },
        availabilityStatus: {
            type: String,
            enum: ['available', 'busy', 'on_leave', 'offline'],
            default: 'available'
        },
        officeLocation: {
            type: String,
            trim: true,
            default: ''
        },
        photo: {
            type: String,
            trim: true,
            default: ''
        },
        termStart: {
            type: Date,
            default: null
        },
        termEnd: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Official', officialSchema);
