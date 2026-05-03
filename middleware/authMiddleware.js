const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendAuthError } = require('../utils/authResponses');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return sendAuthError(res, 401, 'No token provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
        return sendAuthError(res, 401, 'Invalid authorization format');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('_id role isActive');

        if (!user) {
            return sendAuthError(res, 401, 'Invalid token');
        }

        if (!user.isActive) {
            return sendAuthError(res, 403, 'Account is inactive');
        }

        req.user = {
            id: user._id.toString(),
            role: user.role
        };
        next();
    } catch (err) {
        console.error('Auth token verification failed:', err.message);
        return sendAuthError(res, 401, 'Invalid token');
    }
};

module.exports = authMiddleware;
