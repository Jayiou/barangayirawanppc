const mongoose = require('../config/mongoose');

const blockedScheduleSchema = new mongoose.Schema(
    {
        officialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Official',
            required: true
        },
        blockedDate: {
            type: Date,
            required: true
        },
        startTime: {
            type: String,
            required: true // HH:mm format (e.g., "10:00")
        },
        endTime: {
            type: String,
            required: true // HH:mm format (e.g., "12:00")
        },
        note: {
            type: String,
            trim: true,
            default: ''
        },
        reason: {
            type: String,
            trim: true,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
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

// Index for finding blocked schedules by official and date
blockedScheduleSchema.index({ officialId: 1, blockedDate: 1 });
blockedScheduleSchema.index({ blockedDate: 1 });

module.exports = mongoose.model('BlockedSchedule', blockedScheduleSchema);
