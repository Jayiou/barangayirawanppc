const mongoose = require('../config/mongoose');

const healthEventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    prefix: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxLength: 5
    },
    eventDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    isQueueOpen: {
        type: Boolean,
        default: false
    },
    currentServing: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('HealthEvent', healthEventSchema);
