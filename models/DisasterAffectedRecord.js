const mongoose = require('../config/mongoose');

const disasterAffectedRecordSchema = new mongoose.Schema(
    {
        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DisasterIncident',
            required: true
        },
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            default: null
        },
        familyHeadName: {
            type: String,
            trim: true,
            default: ''
        },
        householdSize: {
            type: Number,
            default: 1,
            min: 1
        },
        isEvacuated: {
            type: Boolean,
            default: false
        },
        injuredCount: {
            type: Number,
            default: 0,
            min: 0
        },
        missingCount: {
            type: Number,
            default: 0,
            min: 0
        },
        urgentNeeds: {
            type: [String],
            default: []
        },
        remarks: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('DisasterAffectedRecord', disasterAffectedRecordSchema);
