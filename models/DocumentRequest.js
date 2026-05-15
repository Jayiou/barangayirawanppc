const mongoose = require('../config/mongoose');

const documentRequestSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            required: false,
            default: null
        },
        requesterType: {
            type: String,
            enum: ['resident', 'non_resident'],
            default: 'resident'
        },
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
            enum: ['pending', 'approved', 'processing', 'rejected', 'ready_for_pickup', 'completed', 'cancelled'],
            default: 'pending'
        },
        adminNotes: {
            type: String,
            trim: true,
            default: ''
        },
        generatedDocumentPath: {
            type: String,
            trim: true,
            default: '',
            description: 'Path to the generated PDF file'
        },
        documentSentAt: {
            type: Date,
            default: null,
            description: 'Timestamp when the document was emailed to the resident'
        },
        documentGeneratedAt: {
            type: Date,
            default: null,
            description: 'Timestamp when the PDF was generated'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);
