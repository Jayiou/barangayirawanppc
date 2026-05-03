const test = require('node:test');
const assert = require('node:assert/strict');

const roleMiddleware = require('../middleware/roleMiddleware');
const { createMockResponse, createNext } = require('./helpers/httpMocks');

test('roleMiddleware rejects requests without an authenticated user', () => {
    const req = {};
    const res = createMockResponse();
    const next = createNext();

    roleMiddleware('admin')(req, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Unauthorized' });
    assert.equal(next.called, false);
});

test('roleMiddleware rejects users with the wrong role', () => {
    const req = { user: { role: 'resident' } };
    const res = createMockResponse();
    const next = createNext();

    roleMiddleware('admin')(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { message: 'Access denied' });
    assert.equal(next.called, false);
});

test('roleMiddleware allows users with an accepted role', () => {
    const req = { user: { role: 'admin' } };
    const res = createMockResponse();
    const next = createNext();

    roleMiddleware('admin', 'staff')(req, res, next);

    assert.equal(next.called, true);
    assert.equal(res.statusCode, 200);
});
