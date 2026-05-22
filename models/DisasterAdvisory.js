const mongoose = require('../config/mongoose');

const disasterAdvisorySchema = new mongoose.Schema(
    {
        disasterType: {
            type: String,
            enum: ['typhoon', 'flood', 'landslide'],
            default: 'typhoon'
        },
        expectedImpactDate: {
            type: Date,
            required: true
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium'
        },
        affectedPuroks: {
            type: [String],
            default: []
        },
        floodProneAreas: {
            type: [String],
            default: []
        },
        evacuationCenters: {
            type: [String],
            default: []
        },
        advisoryMessage: {
            type: String,
            trim: true,
            required: true
        },
        status: {
            type: String,
            enum: ['upcoming', 'ongoing', 'ended'],
            default: 'upcoming'
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

module.exports = mongoose.model('DisasterAdvisory', disasterAdvisorySchema);
