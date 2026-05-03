const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../app');
const { resetRateLimitBuckets } = require('../middleware/rateLimitMiddleware');

const startServer = () => {
    const server = app.listen(0);
    const { port } = server.address();

    return {
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((resolve) => server.close(resolve))
    };
};

test.afterEach(() => {
    resetRateLimitBuckets();
});

test('login route rate limits repeated attempts', async () => {
    const server = startServer();

    try {
        let latestResponse;

        for (let attempt = 0; attempt < 11; attempt += 1) {
            latestResponse = await fetch(`${server.baseUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
        }

        const body = await latestResponse.json();

        assert.equal(latestResponse.status, 429);
        assert.equal(body.message, 'Too many login attempts. Please try again later.');
    } finally {
        await server.close();
    }
});
