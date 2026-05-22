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

const publicReportLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 reports per hour per IP
    scope: 'public_report',
    message: 'Too many reports submitted. Please try again after 1 hour.'
});

const publicFacilityLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Max 5 reservations per hour per IP
    scope: 'public_facility',
    message: 'Too many facility reservation requests. Please try again after 1 hour.'
});

module.exports = {
    createRateLimiter,
    resetRateLimitBuckets,
    publicReportLimiter,
    publicFacilityLimiter
};
