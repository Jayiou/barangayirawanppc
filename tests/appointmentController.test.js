const test = require('node:test');
const assert = require('node:assert/strict');

const Appointment = require('../models/Appointment');
const Official = require('../models/Official');
const Resident = require('../models/Resident');
const BlockedSchedule = require('../models/BlockedSchedule');
const ManpowerRequest = require('../models/ManpowerRequest');
const StatusAuditLog = require('../models/StatusAuditLog');
const appointmentController = require('../controllers/appointmentController');
const manpowerRequestController = require('../controllers/manpowerRequestController');
const { createMockResponse } = require('./helpers/httpMocks');

const officialId = '665000000000000000000001';
const residentId = '665000000000000000000002';
const userId = '665000000000000000000003';

const originals = {
    appointmentFindOne: Appointment.findOne,
    appointmentSave: Appointment.prototype.save,
    blockedScheduleFindOne: BlockedSchedule.findOne,
    officialFindById: Official.findById,
    residentFindOne: Resident.findOne,
    manpowerCreate: ManpowerRequest.create,
    manpowerFind: ManpowerRequest.find,
    manpowerFindById: ManpowerRequest.findById,
    manpowerFindByIdAndUpdate: ManpowerRequest.findByIdAndUpdate,
    manpowerFindByIdAndDelete: ManpowerRequest.findByIdAndDelete,
    manpowerSave: ManpowerRequest.prototype.save,
    auditSave: StatusAuditLog.prototype.save
};

test.afterEach(() => {
    Appointment.findOne = originals.appointmentFindOne;
    Appointment.prototype.save = originals.appointmentSave;
    BlockedSchedule.findOne = originals.blockedScheduleFindOne;
    Official.findById = originals.officialFindById;
    Resident.findOne = originals.residentFindOne;
    ManpowerRequest.create = originals.manpowerCreate;
    ManpowerRequest.find = originals.manpowerFind;
    ManpowerRequest.findById = originals.manpowerFindById;
    ManpowerRequest.findByIdAndUpdate = originals.manpowerFindByIdAndUpdate;
    ManpowerRequest.findByIdAndDelete = originals.manpowerFindByIdAndDelete;
    ManpowerRequest.prototype.save = originals.manpowerSave;
    StatusAuditLog.prototype.save = originals.auditSave;
});

test('Appointment generates a slotKey only while the slot should stay reserved', async () => {
    const appointment = new Appointment({
        residentId,
        userId,
        officialId,
        appointmentDate: new Date('2099-05-01T00:00:00'),
        timeSlot: {
            startTime: '09:00',
            endTime: '10:00'
        },
        purpose: 'Consultation',
        status: 'pending'
    });

    await appointment.validate();
    assert.equal(
        appointment.slotKey,
        `${officialId}|2099-05-01|09:00|10:00`
    );

    appointment.status = 'cancelled';
    await appointment.validate();
    assert.equal(appointment.slotKey, undefined);
});

test('requestAppointment returns conflict when another request grabs the same slot first', async () => {
    const req = {
        user: { _id: userId },
        body: {
            officialId,
            appointmentDate: '2099-05-01',
            startTime: '09:00',
            endTime: '10:00',
            purpose: 'Consultation'
        },
        method: 'POST',
        url: '/api/appointments/request'
    };
    const res = createMockResponse();

    StatusAuditLog.prototype.save = async function saveAudit() { return this; };
    Resident.findOne = async () => ({ _id: residentId, userId });
    Official.findById = async () => ({
        _id: officialId,
        status: 'active',
        officeHours: {
            startTime: '08:00',
            endTime: '17:00',
            lunchBreakStart: '12:00',
            lunchBreakEnd: '13:00'
        }
    });
    Appointment.findOne = async () => null;
    BlockedSchedule.findOne = async () => null;
    Appointment.prototype.save = async () => {
        const error = new Error('duplicate key');
        error.code = 11000;
        error.keyPattern = { slotKey: 1 };
        throw error;
    };

    await appointmentController.requestAppointment(req, res);

    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
        success: false,
        message: 'This appointment slot was just booked by another request. Please choose another time slot.'
    });
});

test('createRequest creates resident manpower request with personnel count', async () => {
    const req = {
        user: { id: userId, _id: userId, role: 'resident' },
        body: {
            assistanceType: 'event_security',
            title: 'Parade security',
            description: 'Need tanod for parade route.',
            requestLocation: 'Main road',
            requestDate: '2099-05-01',
            requestTime: '08:00',
            estimatedDuration: '3 hours',
            requestedPersonnelCount: 4,
            priority: 'medium'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: residentId, userId });
    ManpowerRequest.create = async (payload) => ({ _id: '665000000000000000000004', ...payload });
    ManpowerRequest.findById = () => ({
        populate: async () => ({
            _id: '665000000000000000000004',
            residentId,
            ...req.body,
            requestedPersonnelCount: 4,
            status: 'pending'
        })
    });

    await manpowerRequestController.createRequest(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.requestedPersonnelCount, 4);
    assert.equal(res.body.status, 'pending');
});

test('createRequest rejects missing manpower personnel count', async () => {
    const req = {
        user: { id: userId, _id: userId, role: 'resident' },
        body: {
            assistanceType: 'event_security',
            title: 'Parade security',
            description: 'Need tanod for parade route.',
            requestLocation: 'Main road',
            requestDate: '2099-05-01'
        }
    };
    const res = createMockResponse();

    await manpowerRequestController.createRequest(req, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /requestedPersonnelCount/);
});

test('getMyRequests returns only current resident manpower requests', async () => {
    const req = { user: { id: userId, _id: userId, role: 'resident' } };
    const res = createMockResponse();
    let query = null;

    Resident.findOne = async () => ({ _id: residentId, userId });
    ManpowerRequest.find = (criteria) => {
        query = criteria;
        return {
            sort: () => ({
                populate: async () => ([{ _id: '665000000000000000000004', residentId }])
            })
        };
    };

    await manpowerRequestController.getMyRequests(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(query, { residentId });
    assert.equal(res.body.length, 1);
});

test('cancelMyRequest allows owner to cancel pending manpower request', async () => {
    const req = {
        user: { role: 'resident' },
        params: { id: '665000000000000000000004' },
        body: { cancellationReason: 'Cancelled by resident' }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: residentId, userId });
    ManpowerRequest.findById = () => ({
        populate: async () => ({
            _id: req.params.id,
            residentId,
            status: 'cancelled'
        })
    });
    ManpowerRequest.findById = async () => ({
        _id: req.params.id,
        residentId: { toString: () => residentId },
        status: 'pending',
        adminNotes: '',
        save: async function save() {
            this.status = 'cancelled';
            return this;
        }
    });

    const savedFindById = ManpowerRequest.findById;
    let callCount = 0;
    ManpowerRequest.findById = (...args) => {
        callCount += 1;
        if (callCount === 1) {
            return savedFindById(...args);
        }
        return {
            populate: async () => ({
                _id: req.params.id,
                residentId,
                status: 'cancelled'
            })
        };
    };

    await manpowerRequestController.cancelMyRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'cancelled');
});

test('deleteMyRequest allows owner to delete terminal manpower request', async () => {
    const req = {
        user: { id: userId, _id: userId, role: 'resident' },
        params: { id: '665000000000000000000004' }
    };
    const res = createMockResponse();
    let deletedId = '';

    Resident.findOne = async () => ({ _id: residentId, userId });
    ManpowerRequest.findById = async () => ({
        _id: req.params.id,
        residentId: { toString: () => residentId },
        status: 'completed'
    });
    ManpowerRequest.findByIdAndDelete = async (id) => {
        deletedId = id;
    };

    await manpowerRequestController.deleteMyRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(deletedId, req.params.id);
    assert.equal(res.body.success, true);
});

test('updateRequestStatus updates manpower request with valid transition', async () => {
    const req = {
        user: { id: userId, _id: userId, role: 'admin' },
        params: { id: '665000000000000000000004' },
        body: { status: 'approved', adminNotes: 'Approved' }
    };
    const res = createMockResponse();
    let updatedPayload = null;

    StatusAuditLog.prototype.save = async function saveAudit() { return this; };
    ManpowerRequest.findByIdAndUpdate = async (id, payload) => {
        updatedPayload = payload;
        return { _id: id, ...payload };
    };

    let callCount = 0;
    ManpowerRequest.findById = (...args) => {
        callCount += 1;
        if (callCount === 1) {
            return Promise.resolve({ _id: req.params.id, status: 'pending' });
        }
        return {
            populate: async () => ({
                _id: req.params.id,
                residentId,
                status: 'approved',
                adminNotes: 'Approved'
            })
        };
    };

    await manpowerRequestController.updateRequestStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(updatedPayload.status, 'approved');
    assert.equal(res.body.status, 'approved');
});
