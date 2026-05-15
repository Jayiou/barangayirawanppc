const StatusAuditLog = require('../models/StatusAuditLog');

const logStatusChange = async (entityType, entityId, previousStatus, newStatus, adminUser, reason = '', ipAddress = '') => {
    try {
        if (!adminUser || (!adminUser._id && !adminUser.id)) {
            console.warn('[AUDIT] Missing admin user, skipping audit log');
            return null;
        }

        const userId = adminUser._id || adminUser.id;
        const userName = adminUser.username || adminUser.email || 'Unknown';

        const auditLog = new StatusAuditLog({
            entityType,
            entityId,
            previousStatus,
            newStatus,
            changedBy: userId,
            changedByName: userName,
            reason,
            ipAddress
        });

        await auditLog.save();
        console.log(`[AUDIT] ${entityType} ${entityId}: ${previousStatus} → ${newStatus} by ${userName}`);
        return auditLog;
    } catch (error) {
        console.error('Error logging status change:', error);
        throw error;
    }
};

const getStatusHistory = async (entityType, entityId) => {
    try {
        const history = await StatusAuditLog.find({ entityType, entityId })
            .sort({ createdAt: -1 })
            .populate('changedBy', 'username email');

        return history;
    } catch (error) {
        console.error('Error fetching status history:', error);
        throw error;
    }
};

const getAuditLogs = async (filter = {}, page = 1, limit = 20) => {
    try {
        const skip = (page - 1) * limit;
        const logs = await StatusAuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('changedBy', 'username email');

        const total = await StatusAuditLog.countDocuments(filter);

        return {
            logs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
    }
};

module.exports = {
    logStatusChange,
    getStatusHistory,
    getAuditLogs
};
