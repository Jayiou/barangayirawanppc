const test = require('node:test');
const assert = require('node:assert/strict');

const Appointment = require('../models/Appointment');
const Resident = require('../models/Resident');
const Official = require('../models/Official');
const appointmentController = require('../controllers/appointmentController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    appointmentCreate: Appointment.create,
    appointmentFind: Appointment.find,
    appointmentFindById: Appointment.findById,
    appointmentFindByIdAndUpdate: Appointment.findByIdAndUpdate,
    residentFindOne: Resident.findOne,
    officialFindById: Official.findById
};

test.afterEach(() => {
    Appointment.create = originals.appointmentCreate;
    Appointment.find = originals.appointmentFind;
    Appointment.findById = originals.appointmentFindById;
    Appointment.findByIdAndUpdate = originals.appointmentFindByIdAndUpdate;
    Resident.findOne = originals.residentFindOne;
    Official.findById = originals.officialFindById;
});

test('createAppointment rejects requests with missing required fields', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            officialId: 'official-1',
            purpose: 'Certificate request'
        }
    };
    const res = createMockResponse();

    await appointmentController.createAppointment(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'officialId, appointmentDate, timeSlot, and purpose are required'
    });
});

test('createAppointment rejects invalid appointment dates', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            officialId: 'official-1',
            appointmentDate: 'not-a-date',
            timeSlot: '09:00 AM',
            purpose: 'Certificate request'
        }
    };
    const res = createMockResponse();

    await appointmentController.createAppointment(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid appointmentDate'
    });
});

test('createAppointment rejects blank time slots', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            officialId: 'official-1',
            appointmentDate: '2026-05-01',
            timeSlot: '   ',
            purpose: 'Certificate request'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    Official.findById = async () => ({ _id: 'official-1', isActive: true });

    await appointmentController.createAppointment(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid timeSlot'
    });
});

test('createAppointment requires the logged-in user to have a resident profile', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            officialId: 'official-1',
            appointmentDate: '2026-05-01',
            timeSlot: '09:00 AM',
            purpose: 'Certificate request'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;

    await appointmentController.createAppointment(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('createAppointment rejects inactive or missing officials', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            officialId: 'official-1',
            appointmentDate: '2026-05-01',
            timeSlot: '09:00 AM',
            purpose: 'Certificate request'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    Official.findById = async () => ({ _id: 'official-1', isActive: false });

    await appointmentController.createAppointment(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { success: false, message: 'Official not found' });
});

test('createAppointment creates and returns a populated appointment', async () => {
    const populatedAppointment = {
        _id: 'appointment-1',
        residentId: {
            _id: 'resident-1',
            firstName: 'Juan',
            lastName: 'Dela Cruz'
        },
        officialId: {
            _id: 'official-1',
            fullName: 'Captain Reyes'
        },
        appointmentDate: '2026-05-01',
        timeSlot: '09:00 AM',
        purpose: 'Certificate request',
        status: 'pending'
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            officialId: 'official-1',
            appointmentDate: '2026-05-01',
            timeSlot: '09:00 AM',
            purpose: 'Certificate request',
            concernDetails: 'Need barangay certificate'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    Official.findById = async () => ({ _id: 'official-1', isActive: true });
    Appointment.create = async (payload) => ({ _id: 'appointment-1', ...payload });

    Appointment.findById = () => ({
        populate(arg) {
            if (typeof arg === 'string') {
                return Promise.resolve(populatedAppointment);
            }

            return this;
        }
    });

    await appointmentController.createAppointment(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, populatedAppointment);
});

test('getMyAppointments returns 404 when the resident profile does not exist', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;

    await appointmentController.getMyAppointments(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('getAppointmentById blocks residents from viewing another residents appointment', async () => {
    const appointment = {
        _id: 'appointment-1',
        residentId: {
            _id: { toString: () => 'resident-2' }
        }
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        params: { id: 'appointment-1' }
    };
    const res = createMockResponse();

    Appointment.findById = () => ({
        populate(arg) {
            if (typeof arg === 'string') {
                return Promise.resolve(appointment);
            }

            return this;
        }
    });
    Resident.findOne = async () => ({
        _id: { toString: () => 'resident-1' },
        userId: 'user-1'
    });

    await appointmentController.getAppointmentById(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, { success: false, message: 'Access denied' });
});

test('updateAppointmentStatus requires a status value', async () => {
    const req = {
        params: { id: 'appointment-1' },
        body: {
            adminNotes: 'Please bring valid ID'
        }
    };
    const res = createMockResponse();

    await appointmentController.updateAppointmentStatus(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { success: false, message: 'status is required' });
});

test('updateAppointmentStatus returns 404 when the appointment does not exist', async () => {
    const req = {
        params: { id: 'appointment-404' },
        body: {
            status: 'approved'
        }
    };
    const res = createMockResponse();

    Appointment.findByIdAndUpdate = async () => null;

    await appointmentController.updateAppointmentStatus(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { success: false, message: 'Appointment not found' });
});

test('getAppointmentById returns 400 for malformed ids', async () => {
    const req = {
        user: { id: 'user-1', role: 'admin' },
        params: { id: 'bad-id' }
    };
    const res = createMockResponse();

    await appointmentController.getAppointmentById(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid ID format'
    });
});
