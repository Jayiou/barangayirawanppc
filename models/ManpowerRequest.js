const mongoose = require('../config/mongoose');

const manpowerRequestSchema = new mongoose.Schema(
    {
        // Requester Information
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

        // Guest Requester Details (if not resident)
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

        // Request Details
        assistanceType: {
            type: String,
            enum: [
                'peacekeeping',
                'traffic_control',
                'event_security',
                'community_service',
                'emergency_response',
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

        requestLocation: {
            type: String,
            required: true,
            trim: true
        },

        requestDate: {
            type: Date,
            required: true
        },

        requestTime: {
            type: String,
            trim: true,
            default: ''
        },

        // Duration/Timeframe
        estimatedDuration: {
            type: String,
            trim: true,
            default: ''
        },

        requestedPersonnelCount: {
            type: Number,
            required: true,
            min: 1
        },

        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },

        // Status Workflow
        status: {
            type: String,
            enum: ['pending', 'approved', 'assigned', 'in_progress', 'completed', 'rejected', 'cancelled'],
            default: 'pending'
        },

        // Assignment Info
        assignedOfficers: [
            {
                officerName: String,
                officerPosition: String,
                assignedDate: Date
            }
        ],

        // Admin Notes
        adminNotes: {
            type: String,
            trim: true,
            default: ''
        },

        completionNotes: {
            type: String,
            trim: true,
            default: ''
        },

        statusHistory: [
            {
                previousStatus: {
                    type: String,
                    trim: true,
                    default: ''
                },
                newStatus: {
                    type: String,
                    trim: true,
                    default: ''
                },
                reason: {
                    type: String,
                    trim: true,
                    default: ''
                },
                changedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    default: null
                },
                changedByName: {
                    type: String,
                    trim: true,
                    default: ''
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('ManpowerRequest', manpowerRequestSchema);
