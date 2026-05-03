const mongoose = require('../config/mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
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
            type: String,
            required: true,
            trim: true
        },
        purpose: {
            type: String,
            required: true,
            trim: true
        },
        concernDetails: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'rescheduled', 'completed', 'cancelled'],
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

module.exports = mongoose.model('Appointment', appointmentSchema);
