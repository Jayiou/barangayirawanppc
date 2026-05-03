const createMockResponse = () => {
    const response = {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };

    return response;
};

const createNext = () => {
    const next = () => {
        next.called = true;
    };

    next.called = false;

    return next;
};

module.exports = {
    createMockResponse,
    createNext
};
