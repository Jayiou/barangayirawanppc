const mongoose = require('../config/mongoose');

const healthQueueSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthEvent',
        required: true
    },
    requesterType: {
        type: String,
        enum: ['resident', 'guest'],
        default: 'resident'
    },
    residentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
        required: function() { return this.requesterType === 'resident'; }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Not strictly required for guest, we'll check programmatically if needed
    },
    firstName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true, 
        trim: true 
    },
    contactNumber: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        trim: true 
    },
    queueNumber: {
        type: Number,
        required: true
    },
    queueCode: {
        type: String, // e.g. VAX-001
        required: true 
    },
    status: {
        type: String,
        enum: ['waiting', 'serving', 'completed', 'no-show', 'cancelled'],
        default: 'waiting'
    },
    notifiedApproaching: {
        type: Boolean,
        default: false
    },
    notifiedTurn: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Ensure unique queue numbers per event
healthQueueSchema.index({ eventId: 1, queueNumber: 1 }, { unique: true });

module.exports = mongoose.model('HealthQueue', healthQueueSchema);
