const mongoose = require('../config/mongoose');

const smsLogSchema = new mongoose.Schema(
    {
        phoneNumber: {
            type: String,
            required: true,
            trim: true
        },
        messageType: {
            type: String,
            enum: [
                'document_status',
                'resident_approval'
            ],
            required: true
        },
        messageContent: {
            type: String,
            required: true,
            trim: true
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident'
        },
        referenceId: {
            type: String,
            trim: true,
            default: ''
        },
        status: {
            type: String,
            enum: ['sent', 'failed'],
            default: 'sent'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('SMSLog', smsLogSchema);
