const test = require('node:test');
const assert = require('node:assert/strict');

const Resident = require('../models/Resident');
const User = require('../models/User');
const residentController = require('../controllers/residentController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    residentFindOne: Resident.findOne,
    residentCreate: Resident.create,
    residentFindById: Resident.findById,
    residentFindByIdAndUpdate: Resident.findByIdAndUpdate,
    userFindById: User.findById
};

test.afterEach(() => {
    Resident.findOne = originals.residentFindOne;
    Resident.create = originals.residentCreate;
    Resident.findById = originals.residentFindById;
    Resident.findByIdAndUpdate = originals.residentFindByIdAndUpdate;
    User.findById = originals.userFindById;
});

test('createResident rejects requests without userId', async () => {
    const req = {
        body: {
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            sex: 'male',
            birthDate: '2000-01-01',
            address: 'Purok 1'
        }
    };
    const res = createMockResponse();

    await residentController.createResident(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { success: false, message: 'userId is required' });
});

test('createResident rejects non-resident users', async () => {
    const req = {
        body: {
            userId: 'user-1',
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            sex: 'male',
            birthDate: '2000-01-01',
            address: 'Purok 1'
        }
    };
    const res = createMockResponse();

    User.findById = async () => ({ _id: 'user-1', role: 'admin' });

    await residentController.createResident(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Profile can only be created for resident users'
    });
});

test('createResident rejects invalid resident email format', async () => {
    const req = {
        body: {
            userId: 'user-1',
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            sex: 'male',
            birthDate: '2000-01-01',
            address: 'Purok 1',
            email: 'invalid-email'
        }
    };
    const res = createMockResponse();

    await residentController.createResident(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid resident email address'
    });
});

test('getMyResidentProfile returns 404 when the logged-in resident has no profile yet', async () => {
    const req = {
        user: { id: 'user-1' }
    };
    const res = createMockResponse();

    Resident.findOne = () => ({
        populate: async () => null
    });

    await residentController.getMyResidentProfile(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { success: false, message: 'Resident profile not found' });
});

test('upsertMyResidentProfile creates a new profile when one does not exist', async () => {
    const createdResident = {
        _id: 'resident-1',
        userId: 'user-1',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        sex: 'male',
        birthDate: '2000-01-01',
        address: 'Purok 1'
    };

    const req = {
        user: { id: 'user-1' },
        body: {
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            sex: 'male',
            birthDate: '2000-01-01',
            address: 'Purok 1',
            citizenship: 'Filipino'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;
    Resident.create = async (payload) => ({
        _id: 'resident-1',
        ...payload
    });
    Resident.findById = () => ({
        populate: async () => createdResident
    });

    await residentController.upsertMyResidentProfile(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, createdResident);
});

test('upsertMyResidentProfile updates an existing profile and saves it', async () => {
    const existingResident = {
        _id: 'resident-1',
        userId: 'user-1',
        firstName: 'Juan',
        occupation: 'Farmer',
        async save() {
            this.saved = true;
        }
    };

    const updatedResident = {
        _id: 'resident-1',
        userId: 'user-1',
        firstName: 'Juan',
        occupation: 'Teacher',
        contactNumber: '09123456789'
    };

    const req = {
        user: { id: 'user-1' },
        body: {
            occupation: 'Teacher',
            contactNumber: '09123456789'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => existingResident;
    Resident.findById = () => ({
        populate: async () => updatedResident
    });

    await residentController.upsertMyResidentProfile(req, res);

    assert.equal(existingResident.saved, true);
    assert.equal(existingResident.occupation, 'Teacher');
    assert.equal(existingResident.contactNumber, '09123456789');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, updatedResident);
});

test('upsertMyResidentProfile rejects invalid birth dates', async () => {
    const req = {
        user: { id: 'user-1' },
        body: {
            birthDate: 'not-a-real-date'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', async save() {} });

    await residentController.upsertMyResidentProfile(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid birthDate'
    });
});

test('updateResident returns 404 when the target resident does not exist', async () => {
    const req = {
        params: { id: 'resident-404' },
        body: { occupation: 'Teacher' }
    };
    const res = createMockResponse();

    Resident.findByIdAndUpdate = () => ({
        populate: async () => null
    });

    await residentController.updateResident(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { success: false, message: 'Resident profile not found' });
});

test('createResident returns 400 for malformed user ids', async () => {
    const req = {
        body: {
            userId: 'bad-id',
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            sex: 'male',
            birthDate: '2000-01-01',
            address: 'Purok 1'
        }
    };
    const res = createMockResponse();

    await residentController.createResident(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid ID format'
    });
});
