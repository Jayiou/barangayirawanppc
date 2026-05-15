const test = require('node:test');
const assert = require('node:assert/strict');

const FacilityReservation = require('../models/FacilityReservation');
const Resident = require('../models/Resident');
const facilityReservationController = require('../controllers/facilityReservationController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    reservationCreate: FacilityReservation.create,
    reservationFind: FacilityReservation.find,
    reservationFindById: FacilityReservation.findById,
    reservationFindByIdAndUpdate: FacilityReservation.findByIdAndUpdate,
    residentFindOne: Resident.findOne
};

test.afterEach(() => {
    FacilityReservation.create = originals.reservationCreate;
    FacilityReservation.find = originals.reservationFind;
    FacilityReservation.findById = originals.reservationFindById;
    FacilityReservation.findByIdAndUpdate = originals.reservationFindByIdAndUpdate;
    Resident.findOne = originals.residentFindOne;
});

test('createFacilityReservation rejects overlapping approved reservations', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'covered_court',
            reservationDate: '2026-05-01',
            startTime: '10:00',
            endTime: '11:00',
            purpose: 'Youth event'
        }
    };
    const res = createMockResponse();

    FacilityReservation.find = async () => ([
        {
            _id: 'reservation-existing',
            startTime: '09:30',
            endTime: '10:30',
            status: 'approved'
        }
    ]);

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: 'This facility is already reserved for the selected date and time.'
    });
});

test('createFacilityReservation rejects missing required fields', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'covered_court',
            reservationDate: '2026-05-01'
        }
    };
    const res = createMockResponse();

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'facilityName, reservationDate, startTime, endTime, and purpose are required'
    });
});

test('createFacilityReservation requires a resident profile', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'covered_court',
            reservationDate: '2026-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Youth event'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;
    FacilityReservation.find = async () => [];

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('createPublicFacilityReservation rejects missing guest details', async () => {
    const req = {
        body: {
            facilityName: 'covered_court',
            reservationDate: '2026-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Family event'
        }
    };
    const res = createMockResponse();

    await facilityReservationController.createPublicFacilityReservation(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'firstName, lastName, contactNumber, email, and address are required'
    });
});

test('createPublicFacilityReservation creates and returns a populated guest reservation', async () => {
    const populatedReservation = {
        _id: 'reservation-public-1',
        requesterType: 'guest',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        email: 'juan@example.com',
        facilityName: 'covered_court',
        reservationDate: '2026-05-01T00:00:00.000Z',
        status: 'pending'
    };

    const req = {
        body: {
            facilityName: 'covered_court',
            reservationDate: '2026-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Family event',
            reservationDetails: 'Birthday party',
            firstName: 'Juan',
            middleName: '',
            lastName: 'Dela Cruz',
            suffix: '',
            contactNumber: '09171234567',
            email: 'juan@example.com',
            address: 'Outside Barangay'
        }
    };
    const res = createMockResponse();

    FacilityReservation.find = async () => [];
    FacilityReservation.create = async (payload) => ({ _id: 'reservation-public-1', ...payload });
    FacilityReservation.findById = () => ({
        populate() {
            return Promise.resolve(populatedReservation);
        }
    });

    await facilityReservationController.createPublicFacilityReservation(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, populatedReservation);
});

test('createFacilityReservation creates and returns a populated reservation', async () => {
    const populatedReservation = {
        _id: 'reservation-1',
        residentId: {
            _id: 'resident-1',
            firstName: 'Juan',
            lastName: 'Dela Cruz'
        },
        facilityName: 'covered_court',
        reservationDate: '2026-05-01T00:00:00.000Z',
        status: 'pending'
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'covered_court',
            reservationDate: '2026-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Youth event',
            reservationDetails: 'Basketball clinic'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    FacilityReservation.find = async () => [];
    FacilityReservation.create = async (payload) => ({ _id: 'reservation-1', ...payload });
    FacilityReservation.findById = () => ({
        populate() {
            return Promise.resolve(populatedReservation);
        }
    });

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, populatedReservation);
});

test('getMyFacilityReservations returns 404 when resident profile does not exist', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;

    await facilityReservationController.getMyFacilityReservations(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('getFacilityAvailability returns reserved and available slots for the selected date', async () => {
    const req = {
        query: {
            facilityName: 'covered_court',
            date: '2026-05-01'
        }
    };
    const res = createMockResponse();

    FacilityReservation.find = () => ({
        sort() {
            return Promise.resolve([
                {
                    _id: 'reservation-1',
                    startTime: '09:00',
                    endTime: '11:00',
                    status: 'approved'
                },
                {
                    _id: 'reservation-2',
                    startTime: '13:00',
                    endTime: '14:00',
                    status: 'approved'
                }
            ]);
        }
    });

    await facilityReservationController.getFacilityAvailability(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
        facilityName: 'covered_court',
        date: '2026-05-01',
        operatingHours: {
            start: '08:00',
            end: '17:00'
        },
        reservedSlots: [
            {
                id: 'reservation-1',
                startTime: '09:00',
                endTime: '11:00',
                status: 'approved'
            },
            {
                id: 'reservation-2',
                startTime: '13:00',
                endTime: '14:00',
                status: 'approved'
            }
        ],
        availableSlots: [
            { startTime: '08:00', endTime: '09:00' },
            { startTime: '11:00', endTime: '12:00' },
            { startTime: '12:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '15:00' },
            { startTime: '15:00', endTime: '16:00' },
            { startTime: '16:00', endTime: '17:00' }
        ]
    });
});

test('getFacilityReservationById blocks residents from viewing other residents reservations', async () => {
    const reservation = {
        _id: 'reservation-1',
        residentId: {
            _id: { toString: () => 'resident-2' }
        }
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        params: { id: 'reservation-1' }
    };
    const res = createMockResponse();

    FacilityReservation.findById = () => ({
        populate() {
            return Promise.resolve(reservation);
        }
    });
    Resident.findOne = async () => ({
        _id: { toString: () => 'resident-1' },
        userId: 'user-1'
    });

    await facilityReservationController.getFacilityReservationById(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Access denied'
    });
});

test('updateFacilityReservationStatus requires a status value', async () => {
    const req = {
        params: { id: 'reservation-1' },
        body: {
            adminNotes: 'Please adjust your time'
        }
    };
    const res = createMockResponse();

    await facilityReservationController.updateFacilityReservationStatus(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'status is required'
    });
});

test('updateFacilityReservationStatus rejects conflicting approvals', async () => {
    const req = {
        params: { id: 'reservation-1' },
        body: {
            status: 'approved'
        }
    };
    const res = createMockResponse();

    FacilityReservation.findById = async () => ({
        _id: 'reservation-1',
        facilityName: 'covered_court',
        reservationDate: '2026-05-01',
        startTime: '10:00',
        endTime: '11:00',
        status: 'pending'
    });
    FacilityReservation.find = async () => ([
        {
            _id: 'reservation-2',
            startTime: '10:30',
            endTime: '11:30',
            status: 'approved'
        }
    ]);

    await facilityReservationController.updateFacilityReservationStatus(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: 'This facility is already reserved for the selected date and time.'
    });
});

test('updateFacilityReservationStatus returns 404 when reservation does not exist', async () => {
    const req = {
        params: { id: 'reservation-404' },
        body: {
            status: 'approved'
        }
    };
    const res = createMockResponse();

    FacilityReservation.findById = async () => null;
    FacilityReservation.findByIdAndUpdate = async () => null;
    await facilityReservationController.updateFacilityReservationStatus(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Facility reservation not found'
    });
});

test('getFacilityReservationById returns 400 for malformed ids', async () => {
    const req = {
        user: { id: 'user-1', role: 'admin' },
        params: { id: 'bad-id' }
    };
    const res = createMockResponse();

    await facilityReservationController.getFacilityReservationById(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid ID format'
    });
});
