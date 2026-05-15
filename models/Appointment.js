const mongoose = require('../config/mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        officialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Official',
            required: true
        },
        appointmentDate: {
            type: Date,
            required: true
        },
        timeSlot: {
            startTime: {
                type: String,
                required: true // HH:mm format (e.g., "09:00")
            },
            endTime: {
                type: String,
                required: true // HH:mm format (e.g., "10:00")
            }
        },
        purpose: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'expired'],
            default: 'pending'
        },
        remarks: {
            type: String,
            trim: true,
            default: ''
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: ''
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        approvedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
            type: Date,
            default: null
        },
        cancelledAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        expiredAt: {
            type: Date,
            default: null
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

// Index for finding resident's active appointments
appointmentSchema.index({ residentId: 1, status: 1 });
appointmentSchema.index({ officialId: 1, appointmentDate: 1, 'timeSlot.startTime': 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
