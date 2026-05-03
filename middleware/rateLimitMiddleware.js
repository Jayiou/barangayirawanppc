const { createHttpError } = require('../utils/httpError');

const buckets = new Map();

const getClientKey = (req, scope) => {
    const ip = req.ip || 'unknown';
    return `${scope}:${ip}`;
};

const createRateLimiter = ({ windowMs, max, scope, message }) => (req, res, next) => {
    const now = Date.now();
    const key = getClientKey(req, scope);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, {
            count: 1,
            resetAt: now + windowMs
        });
        return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
        const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
        res.set('Retry-After', String(retryAfterSeconds));
        return next(createHttpError(429, message || 'Too many attempts. Please try again later.', {
            code: 'RATE_LIMITED'
        }));
    }

    return next();
};

const resetRateLimitBuckets = () => {
    buckets.clear();
};

module.exports = {
    createRateLimiter,
    resetRateLimitBuckets
};
