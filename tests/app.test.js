const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../app');

test('GET /health returns ok status', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(body, { status: 'ok' });
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('GET / returns the frontend shell', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    try {
        const response = await fetch(`http://127.0.0.1:${port}/`);
        const body = await response.text();

        assert.equal(response.status, 200);
        assert.match(body, /Barangay Connect/);
        assert.match(body, /<div id="app"><\/div>/);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('GET /admin returns the separate admin entry page', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    try {
        const response = await fetch(`http://127.0.0.1:${port}/admin`);
        const body = await response.text();

        assert.equal(response.status, 200);
        assert.match(body, /Admin Portal \| Barangay Connect/);
        assert.match(body, /<div id="app"><\/div>/);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('CORS allows configured origins and rejects unknown browser origins', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    try {
        const allowedResponse = await fetch(`http://127.0.0.1:${port}/health`, {
            headers: { Origin: 'http://localhost:5000' }
        });

        assert.equal(allowedResponse.status, 200);
        assert.equal(allowedResponse.headers.get('access-control-allow-origin'), 'http://localhost:5000');

        const blockedResponse = await fetch(`http://127.0.0.1:${port}/health`, {
            headers: { Origin: 'https://unknown.example' }
        });

        assert.equal(blockedResponse.status, 403);
        assert.equal(blockedResponse.headers.get('access-control-allow-origin'), null);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

test('public uploads route blocks proof of residency files', async () => {
    const server = app.listen(0);
    const { port } = server.address();

    try {
        const response = await fetch(`http://127.0.0.1:${port}/uploads/proofOfResidency-test.jpg`);
        const body = await response.json();

        assert.equal(response.status, 403);
        assert.deepEqual(body, {
            success: false,
            message: 'Proof of residency files are private'
        });
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
