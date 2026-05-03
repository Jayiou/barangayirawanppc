const test = require('node:test');
const assert = require('node:assert/strict');

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { createMockResponse, createNext } = require('./helpers/httpMocks');

const originalFindById = User.findById;

test.afterEach(() => {
    User.findById = originalFindById;
});

test('authMiddleware rejects missing authorization header', async () => {
    const req = { headers: {} };
    const res = createMockResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { success: false, message: 'No token provided' });
    assert.equal(next.called, false);
});

test('authMiddleware rejects invalid bearer format', async () => {
    const req = { headers: { authorization: 'Token abc123' } };
    const res = createMockResponse();
    const next = createNext();

    await authMiddleware(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { success: false, message: 'Invalid authorization format' });
    assert.equal(next.called, false);
});

test('authMiddleware stores the latest user role from the database and calls next for valid tokens', async () => {
    const secret = 'test-secret';
    const token = jwt.sign({ id: 'user-1', role: 'resident' }, secret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockResponse();
    const next = createNext();

    process.env.JWT_SECRET = secret;
    User.findById = () => ({
        select: async () => ({
            _id: 'user-1',
            role: 'admin',
            isActive: true
        })
    });

    await authMiddleware(req, res, next);

    assert.equal(next.called, true);
    assert.equal(req.user.id, 'user-1');
    assert.equal(req.user.role, 'admin');
});

test('authMiddleware rejects inactive users even when the token is valid', async () => {
    const secret = 'test-secret';
    const token = jwt.sign({ id: 'user-1', role: 'admin' }, secret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createMockResponse();
    const next = createNext();

    process.env.JWT_SECRET = secret;
    User.findById = () => ({
        select: async () => ({
            _id: 'user-1',
            role: 'admin',
            isActive: false
        })
    });

    await authMiddleware(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { success: false, message: 'Account is inactive' });
    assert.equal(next.called, false);
});
