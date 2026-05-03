const mongoose = require('../config/mongoose');

const documentRequestSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            required: true
        },
        documentType: {
            type: String,
            enum: [
                'barangay_clearance',
                'certificate_of_residency',
                'certificate_of_indigency'
            ],
            required: true
        },
        purpose: {
            type: String,
            required: true,
            trim: true
        },
        requestDetails: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'ready_for_pickup', 'completed', 'cancelled'],
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

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);
