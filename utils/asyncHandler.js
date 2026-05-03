const errorHandler = require('../middleware/errorMiddleware');

const asyncHandler = (handler) => async (req, res, next) => {
    try {
        await handler(req, res, next);
    } catch (error) {
        if (typeof next === 'function') {
            return next(error);
        }

        return errorHandler(error, req, res, () => {});
    }
};

module.exports = asyncHandler;
