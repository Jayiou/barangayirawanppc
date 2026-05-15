const mongoose = require('../config/mongoose');

const reportSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            default: null
        },
        requesterType: {
            type: String,
            enum: ['resident', 'guest'],
            default: 'resident'
        },
        firstName: {
            type: String,
            trim: true,
            default: ''
        },
        middleName: {
            type: String,
            trim: true,
            default: ''
        },
        lastName: {
            type: String,
            trim: true,
            default: ''
        },
        suffix: {
            type: String,
            trim: true,
            default: ''
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
        address: {
            type: String,
            trim: true,
            default: ''
        },
        reportType: {
            type: String,
            enum: [
                'noise_complaint',
                'disturbance',
                'sanitation',
                'infrastructure',
                'public_safety',
                'animal_related',
                'disaster',
                'other'
            ],
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        locationText: {
            type: String,
            required: true,
            trim: true
        },
        locationCoordinates: {
            latitude: {
                type: Number,
                default: null
            },
            longitude: {
                type: Number,
                default: null
            },
            accuracy: {
                type: Number,
                default: null
            }
        },
        incidentDate: {
            type: Date,
            default: null
        },
        proofFiles: {
            type: [String],
            default: []
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'emergency'],
            default: 'medium'
        },
        isAnonymous: {
            type: Boolean,
            default: false
        },
        contactPreference: {
            type: String,
            enum: ['phone', 'email', 'in_app', 'none'],
            default: 'in_app'
        },
        status: {
            type: String,
            enum: ['pending', 'reviewing', 'in_progress', 'resolved', 'rejected', 'closed'],
            default: 'pending'
        },
        adminNotes: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Report', reportSchema);
