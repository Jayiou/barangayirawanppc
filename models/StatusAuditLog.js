const mongoose = require('../config/mongoose');

const statusAuditLogSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            enum: ['DocumentRequest', 'FacilityReservation', 'Report', 'User'],
            required: true
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        previousStatus: {
            type: String,
            required: true
        },
        newStatus: {
            type: String,
            required: true
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        changedByName: {
            type: String,
            trim: true
        },
        reason: {
            type: String,
            trim: true,
            default: ''
        },
        ipAddress: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

// Index for quick lookups
statusAuditLogSchema.index({ entityType: 1, entityId: 1 });
statusAuditLogSchema.index({ changedBy: 1 });
statusAuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StatusAuditLog', statusAuditLogSchema);
