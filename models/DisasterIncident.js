const mongoose = require('../config/mongoose');

const disasterIncidentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        disasterType: {
            type: String,
            enum: ['flood', 'typhoon', 'fire', 'earthquake', 'landslide', 'other'],
            default: 'other'
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        affectedArea: {
            type: String,
            trim: true,
            default: ''
        },
        occurredAt: {
            type: Date,
            default: Date.now
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['active', 'monitoring', 'resolved'],
            default: 'active'
        },
        media: {
            type: [String],
            default: []
        },
        source: {
            type: String,
            enum: ['manual', 'resident_report'],
            default: 'manual'
        },
        linkedReportIds: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Report'
            }],
            default: []
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('DisasterIncident', disasterIncidentSchema);
