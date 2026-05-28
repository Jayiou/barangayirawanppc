const test = require('node:test');
const assert = require('node:assert/strict');

const FacilityReservation = require('../models/FacilityReservation');
const Resident = require('../models/Resident');
const facilityReservationController = require('../controllers/facilityReservationController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    reservationCreate: FacilityReservation.create,
    reservationFind: FacilityReservation.find,
    reservationFindOne: FacilityReservation.findOne,
    reservationFindById: FacilityReservation.findById,
    reservationFindByIdAndUpdate: FacilityReservation.findByIdAndUpdate,
    residentFindOne: Resident.findOne
};

test.afterEach(() => {
    FacilityReservation.create = originals.reservationCreate;
    FacilityReservation.find = originals.reservationFind;
    FacilityReservation.findOne = originals.reservationFindOne;
    FacilityReservation.findById = originals.reservationFindById;
    FacilityReservation.findByIdAndUpdate = originals.reservationFindByIdAndUpdate;
    Resident.findOne = originals.residentFindOne;
});

test('createFacilityReservation rejects overlapping approved reservations', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'chair',
            reservationDate: '2099-05-01',
            startTime: '10:00',
            endTime: '11:00',
            purpose: 'Youth event',
            quantity: 250
        }
    };
    const res = createMockResponse();

    FacilityReservation.find = async () => ([
        {
            _id: 'reservation-existing',
            startTime: '09:30',
            endTime: '10:30',
            status: 'approved',
            quantity: 100,
            facilityName: 'chair'
        }
    ]);

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Only 200 chairs are available for the selected time.'
    });
});

test('createFacilityReservation rejects missing required fields', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'chair',
            reservationDate: '2099-05-01'
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
            facilityName: 'chair',
            reservationDate: '2099-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Youth event',
            quantity: 120
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

test('createFacilityReservation rejects reservations that are too soon', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'chair',
            reservationDate: '2026-05-23',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Youth event',
            quantity: 50
        }
    };
    const res = createMockResponse();

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Reservations must be scheduled at least 1 day in advance'
    });
});

test('createFacilityReservation rejects zero inventory requests', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'chair',
            reservationDate: '2099-05-25',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Youth event',
            quantity: 0
        }
    };
    const res = createMockResponse();

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please reserve at least 1 item'
    });
});

test('createPublicFacilityReservation rejects missing guest details', async () => {
    const req = {
        body: {
            facilityName: 'chair',
            reservationDate: '2099-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Family event',
            quantity: 80
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
        facilityName: 'chair',
        quantity: 80,
        reservationDate: '2099-05-01T00:00:00.000Z',
        status: 'pending'
    };

    const req = {
        body: {
            facilityName: 'chair',
            reservationDate: '2099-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Family event',
            quantity: 80,
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
    FacilityReservation.findOne = async () => null;
    FacilityReservation.create = async (payload) => {
        assert.equal(payload.quantity, 80);
        return { _id: 'reservation-public-1', ...payload };
    };
    FacilityReservation.findById = () => ({
        populate() {
            return Promise.resolve(populatedReservation);
        }
    });

    await facilityReservationController.createPublicFacilityReservation(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, populatedReservation);
});

test('createPublicFacilityReservation rejects overlapping non-inventory reservations', async () => {
    const req = {
        body: {
            facilityName: 'barangay_hall',
            reservationDate: '2099-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Family event',
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            contactNumber: '09171234567',
            email: 'juan@example.com',
            address: 'Outside Barangay'
        }
    };
    const res = createMockResponse();

    FacilityReservation.findOne = async () => null;
    FacilityReservation.find = async () => ([
        {
            _id: 'reservation-existing',
            facilityName: 'barangay_hall',
            startTime: '10:00',
            endTime: '12:00',
            status: 'approved'
        }
    ]);

    await facilityReservationController.createPublicFacilityReservation(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: 'This facility is already reserved for the selected date and time.'
    });
});

test('createPublicFacilityReservation checks inventory conflicts by peak concurrent quantity', async () => {
    const populatedReservation = {
        _id: 'reservation-public-peak',
        requesterType: 'guest',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        email: 'juan@example.com',
        facilityName: 'chair',
        quantity: 100,
        reservationDate: '2099-05-01T00:00:00.000Z',
        status: 'pending'
    };
    const req = {
        body: {
            facilityName: 'chair',
            reservationDate: '2099-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Family event',
            quantity: 100,
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            contactNumber: '09171234567',
            email: 'juan@example.com',
            address: 'Outside Barangay'
        }
    };
    const res = createMockResponse();

    FacilityReservation.findOne = async () => null;
    FacilityReservation.find = async () => ([
        {
            _id: 'reservation-1',
            facilityName: 'chair',
            startTime: '09:00',
            endTime: '10:00',
            status: 'approved',
            quantity: 200
        },
        {
            _id: 'reservation-2',
            facilityName: 'chair',
            startTime: '10:00',
            endTime: '11:00',
            status: 'approved',
            quantity: 200
        }
    ]);
    FacilityReservation.create = async (payload) => {
        assert.equal(payload.quantity, 100);
        return { _id: 'reservation-public-peak', ...payload };
    };
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
        facilityName: 'chair',
        quantity: 120,
        reservationDate: '2099-05-01T00:00:00.000Z',
        status: 'pending'
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'chair',
            reservationDate: '2099-05-01',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Youth event',
            quantity: 120,
            reservationDetails: 'Basketball clinic'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    FacilityReservation.find = async () => [];
    FacilityReservation.create = async (payload) => {
        assert.equal(payload.quantity, 120);
        return { _id: 'reservation-1', ...payload };
    };
    FacilityReservation.findById = () => ({
        populate() {
            return Promise.resolve(populatedReservation);
        }
    });

    await facilityReservationController.createFacilityReservation(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, populatedReservation);
});

test('createFacilityReservation supports table inventory reservations', async () => {
    const populatedReservation = {
        _id: 'reservation-table-1',
        residentId: {
            _id: 'resident-1',
            firstName: 'Juan',
            lastName: 'Dela Cruz'
        },
        facilityName: 'table',
        tableQuantity: 12,
        quantity: 12,
        reservationDate: '2099-05-02T00:00:00.000Z',
        status: 'pending'
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            facilityName: 'table',
            reservationDate: '2099-05-02',
            startTime: '09:00',
            endTime: '11:00',
            purpose: 'Town event',
            tableQuantity: 12,
            reservationDetails: 'Extra tables for registration'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    FacilityReservation.find = async () => [];
    FacilityReservation.create = async (payload) => {
        assert.equal(payload.tableQuantity, 12);
        assert.equal(payload.quantity, 12);
        return { _id: 'reservation-table-1', ...payload };
    };
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
            facilityName: 'chair',
            date: '2099-05-01',
            startTime: '09:00',
            endTime: '11:00'
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
                    status: 'approved',
                    facilityName: 'chair',
                    quantity: 100
                },
                {
                    _id: 'reservation-2',
                    startTime: '13:00',
                    endTime: '14:00',
                    status: 'pending',
                    facilityName: 'chair',
                    quantity: 50
                }
            ]);
        }
    });

    await facilityReservationController.getFacilityAvailability(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.facilityName, 'chair');
    assert.deepEqual(res.body.date, '2099-05-01');
    assert.deepEqual(res.body.operatingHours, {
        start: '08:00',
        end: '24:00'
    });
    assert.deepEqual(res.body.inventory, {
        chair: 300,
        tent: 30,
        table: 20
    });
    assert.equal(res.body.inventoryQuantity, 300);
    assert.equal(res.body.reservedQuantity, 100);
    assert.equal(res.body.availableQuantity, 200);
    assert.deepEqual(res.body.selectedAvailability, {
        facilityName: 'chair',
        inventoryQuantity: 300,
        reservedQuantity: 100,
        availableQuantity: 200
    });
    assert.equal(res.body.reservedSlots.length, 2);
    assert.deepEqual(res.body.reservedSlots[0], {
        id: 'reservation-1',
        facilityName: 'chair',
        startTime: '09:00',
        endTime: '11:00',
        status: 'approved',
        quantity: 100
    });
    assert.deepEqual(res.body.reservedSlots[1], {
        id: 'reservation-2',
        facilityName: 'chair',
        startTime: '13:00',
        endTime: '14:00',
        status: 'pending',
        quantity: 50
    });
    assert.equal(res.body.availableSlots.length, 32);
    assert.deepEqual(res.body.availableSlots.slice(0, 4), [
        { startTime: '08:00', endTime: '08:30' },
        { startTime: '08:30', endTime: '09:00' },
        { startTime: '09:00', endTime: '09:30' },
        { startTime: '09:30', endTime: '10:00' }
    ]);
    assert.deepEqual(res.body.availableSlots.slice(-2), [
        { startTime: '23:00', endTime: '23:30' },
        { startTime: '23:30', endTime: '24:00' }
    ]);
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
        facilityName: 'barangay_hall',
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

test('updateFacilityReservationStatus rejects inventory approvals beyond available quantity', async () => {
    const req = {
        params: { id: 'reservation-1' },
        body: {
            status: 'approved'
        }
    };
    const res = createMockResponse();

    FacilityReservation.findById = async () => ({
        _id: 'reservation-1',
        facilityName: 'chair',
        reservationDate: '2026-05-01',
        startTime: '10:00',
        endTime: '11:00',
        status: 'pending',
        quantity: 250
    });
    FacilityReservation.find = async () => ([
        {
            _id: 'reservation-2',
            facilityName: 'chair',
            startTime: '10:30',
            endTime: '11:30',
            status: 'approved',
            quantity: 100
        }
    ]);

    await facilityReservationController.updateFacilityReservationStatus(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Only 200 chairs are available for the selected time.'
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
