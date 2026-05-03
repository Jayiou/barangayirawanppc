const mongoose = require('../config/mongoose');

const reportSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            required: true
        },
        reportType: {
            type: String,
            enum: [
                'noise_complaint',
                'disturbance',
                'blotter',
                'sanitation',
                'infrastructure',
                'manpower_request',
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
        incidentDate: {
            type: Date,
            default: null
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
