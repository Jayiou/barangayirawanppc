class HttpError extends Error {
    constructor(statusCode, message, options = {}) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.code = options.code || 'APP_ERROR';
        this.expose = options.expose ?? statusCode < 500;
    }
}

const createHttpError = (statusCode, message, options) => new HttpError(statusCode, message, options);

module.exports = {
    HttpError,
    createHttpError
};
