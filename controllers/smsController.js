const SMSLog = require('../models/SMSLog');

const getSMSLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, messageType, startDate, endDate } = req.query;

        let filter = {};

        if (messageType) {
            filter.messageType = messageType;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        const skip = (page - 1) * limit;
        const smsLogs = await SMSLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await SMSLog.countDocuments(filter);

        res.json({
            success: true,
            data: smsLogs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching SMS logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching SMS logs',
            error: error.message
        });
    }
};

const getSMSLogStats = async (req, res) => {
    try {
        const stats = await SMSLog.aggregate([
            {
                $group: {
                    _id: '$messageType',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalSms = await SMSLog.countDocuments();

        res.json({
            success: true,
            data: {
                total: totalSms,
                byType: stats
            }
        });
    } catch (error) {
        console.error('Error fetching SMS stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching SMS stats',
            error: error.message
        });
    }
};

module.exports = {
    getSMSLogs,
    getSMSLogStats
};
