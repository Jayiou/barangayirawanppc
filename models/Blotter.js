const mongoose = require('../config/mongoose');

const blotterSchema = new mongoose.Schema(
    {
        // Complainant Information
        complainantName: {
            type: String,
            required: true,
            trim: true
        },
        complainantAddress: {
            type: String,
            required: true,
            trim: true
        },
        complainantContactNumber: {
            type: String,
            trim: true,
            default: ''
        },
        complainantEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },

        // Respondent/Accused Information
        respondentName: {
            type: String,
            required: true,
            trim: true
        },
        respondentAddress: {
            type: String,
            trim: true,
            default: ''
        },

        // Incident Details
        incidentDate: {
            type: Date,
            required: true
        },
        incidentTime: {
            type: String,
            trim: true,
            default: ''
        },
        incidentLocation: {
            type: String,
            required: true,
            trim: true
        },

        // Narrative and Facts
        narrative: {
            type: String,
            required: true,
            trim: true
        },

        // Blotter Type/Category
        blotterType: {
            type: String,
            enum: [
                'assault',
                'theft',
                'harassment',
                'dispute',
                'trespassing',
                'property_damage',
                'disturbing_peace',
                'other'
            ],
            required: true
        },

        // Status Workflow
        status: {
            type: String,
            enum: ['draft', 'recorded', 'investigating', 'resolved', 'closed'],
            default: 'draft'
        },

        // Admin Notes
        adminNotes: {
            type: String,
            trim: true,
            default: ''
        },

        // Investigation Details
        investigatingOfficer: {
            type: String,
            trim: true,
            default: ''
        },
        findings: {
            type: String,
            trim: true,
            default: ''
        },

        // Sign-offs
        recordedBy: {
            type: String,
            trim: true,
            default: ''
        },
        recordedDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Blotter', blotterSchema);
