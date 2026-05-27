const test = require('node:test');
const assert = require('node:assert/strict');

const Appointment = require('../models/Appointment');
const Official = require('../models/Official');
const Resident = require('../models/Resident');
const BlockedSchedule = require('../models/BlockedSchedule');
const appointmentController = require('../controllers/appointmentController');
const { createMockResponse } = require('./helpers/httpMocks');

const officialId = '665000000000000000000001';
const residentId = '665000000000000000000002';
const userId = '665000000000000000000003';

const originals = {
    appointmentFindOne: Appointment.findOne,
    appointmentSave: Appointment.prototype.save,
    blockedScheduleFindOne: BlockedSchedule.findOne,
    officialFindById: Official.findById,
    residentFindOne: Resident.findOne
};

test.afterEach(() => {
    Appointment.findOne = originals.appointmentFindOne;
    Appointment.prototype.save = originals.appointmentSave;
    BlockedSchedule.findOne = originals.blockedScheduleFindOne;
    Official.findById = originals.officialFindById;
    Resident.findOne = originals.residentFindOne;
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
