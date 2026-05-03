const mongoose = require('../config/mongoose');

const facilityReservationSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            required: true
        },
        facilityName: {
            type: String,
            enum: ['barangay_hall', 'covered_court', 'multi_purpose_hall'],
            required: true
        },
        reservationDate: {
            type: Date,
            required: true
        },
        startTime: {
            type: String,
            required: true,
            trim: true
        },
        endTime: {
            type: String,
            required: true,
            trim: true
        },
        purpose: {
            type: String,
            required: true,
            trim: true
        },
        reservationDetails: {
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

module.exports = mongoose.model('FacilityReservation', facilityReservationSchema);
