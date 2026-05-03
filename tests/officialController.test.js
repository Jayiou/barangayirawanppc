const test = require('node:test');
const assert = require('node:assert/strict');

const Official = require('../models/Official');
const officialController = require('../controllers/officialController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    officialCreate: Official.create,
    officialFind: Official.find,
    officialFindById: Official.findById,
    officialFindByIdAndUpdate: Official.findByIdAndUpdate,
    officialFindByIdAndDelete: Official.findByIdAndDelete
};

test.afterEach(() => {
    Official.create = originals.officialCreate;
    Official.find = originals.officialFind;
    Official.findById = originals.officialFindById;
    Official.findByIdAndUpdate = originals.officialFindByIdAndUpdate;
    Official.findByIdAndDelete = originals.officialFindByIdAndDelete;
});

test('createOfficial rejects missing fullName or position', async () => {
    const req = {
        body: {
            fullName: 'Captain Reyes'
        }
    };
    const res = createMockResponse();

    await officialController.createOfficial(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'fullName and position are required'
    });
});

test('createOfficial rejects invalid official email format', async () => {
    const req = {
        body: {
            fullName: 'Captain Reyes',
            position: 'Barangay Captain',
            email: 'bad-email'
        }
    };
    const res = createMockResponse();

    await officialController.createOfficial(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid official email address'
    });
});

test('createOfficial normalizes officeDays and creates the record', async () => {
    const req = {
        body: {
            fullName: 'Captain Reyes',
            position: 'Barangay Captain',
            officeDays: [' Monday ', 'Tuesday', '']
        }
    };
    const res = createMockResponse();

    Official.create = async (payload) => payload;

    await officialController.createOfficial(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body.officeDays, ['Monday', 'Tuesday']);
});

test('getOfficials hides inactive officials for non-admin users', async () => {
    const req = {
        user: { role: 'resident' }
    };
    const res = createMockResponse();

    Official.find = (filter) => ({
        sort: async () => [{ _id: 'official-1', isActive: true, filterUsed: filter }]
    });

    await officialController.getOfficials(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, [{ _id: 'official-1', isActive: true, filterUsed: { isActive: true } }]);
});

test('getOfficialById returns 404 for inactive officials when requester is not admin', async () => {
    const req = {
        user: { role: 'resident' },
        params: { id: 'official-1' }
    };
    const res = createMockResponse();

    Official.findById = async () => ({ _id: 'official-1', isActive: false });

    await officialController.getOfficialById(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Official not found'
    });
});

test('updateOfficial rejects invalid termEnd dates', async () => {
    const req = {
        params: { id: 'official-1' },
        body: { termEnd: 'not-a-date' }
    };
    const res = createMockResponse();

    await officialController.updateOfficial(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid termEnd date'
    });
});

test('deleteOfficial returns 404 when the official does not exist', async () => {
    const req = {
        params: { id: 'official-404' }
    };
    const res = createMockResponse();

    Official.findByIdAndDelete = async () => null;

    await officialController.deleteOfficial(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Official not found'
    });
});

test('getOfficialById returns 400 for malformed ids', async () => {
    const req = {
        user: { role: 'admin' },
        params: { id: 'bad-id' }
    };
    const res = createMockResponse();

    await officialController.getOfficialById(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid ID format'
    });
});
