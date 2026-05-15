const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { getStatusHistory, getAuditLogs } = require('../utils/statusLogger');

exports.getStatusHistory = asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;

    if (!entityType || !entityId) {
        throw createHttpError(400, 'entityType and entityId are required', {
            code: 'MISSING_PARAMS'
        });
    }

    try {
        const history = await getStatusHistory(entityType, entityId);
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching status history:', error);
        throw createHttpError(500, 'Error fetching status history', {
            code: 'FETCH_HISTORY_ERROR'
        });
    }
});

exports.getAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, entityType, changedBy } = req.query;

    let filter = {};

    if (entityType) {
        filter.entityType = entityType;
    }

    if (changedBy) {
        filter.changedBy = changedBy;
    }

    try {
        const result = await getAuditLogs(filter, parseInt(page), parseInt(limit));
        res.json({
            success: true,
            data: result.logs,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        throw createHttpError(500, 'Error fetching audit logs', {
            code: 'FETCH_LOGS_ERROR'
        });
    }
});

exports.getAuditStats = asyncHandler(async (req, res) => {
    try {
        const StatusAuditLog = require('../models/StatusAuditLog');

        const stats = await StatusAuditLog.aggregate([
            {
                $group: {
                    _id: '$entityType',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await StatusAuditLog.countDocuments();

        res.json({
            success: true,
            data: {
                total,
                byEntityType: stats
            }
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        throw createHttpError(500, 'Error fetching audit stats', {
            code: 'FETCH_STATS_ERROR'
        });
    }
});
