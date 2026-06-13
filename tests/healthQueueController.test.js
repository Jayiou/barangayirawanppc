const test = require('node:test');
const assert = require('node:assert/strict');

const HealthEvent = require('../models/HealthEvent');
const HealthQueue = require('../models/HealthQueue');
const Resident = require('../models/Resident');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');
const controller = require('../controllers/healthQueueController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    eventFindById: HealthEvent.findById,
    queueFind: HealthQueue.find,
    queueFindOne: HealthQueue.findOne,
    queueFindOneAndUpdate: HealthQueue.findOneAndUpdate,
    queueUpdateMany: HealthQueue.updateMany,
    queueCountDocuments: HealthQueue.countDocuments,
    queueDeleteOne: HealthQueue.deleteOne,
    queueSave: HealthQueue.prototype.save,
    residentFindOne: Resident.findOne,
    sendEmail: mailer.sendCustomResidentEmail,
    sendSms: sms.sendSmsNotification
};

test.afterEach(() => {
    HealthEvent.findById = originals.eventFindById;
    HealthQueue.find = originals.queueFind;
    HealthQueue.findOne = originals.queueFindOne;
    HealthQueue.findOneAndUpdate = originals.queueFindOneAndUpdate;
    HealthQueue.updateMany = originals.queueUpdateMany;
    HealthQueue.countDocuments = originals.queueCountDocuments;
    HealthQueue.deleteOne = originals.queueDeleteOne;
    HealthQueue.prototype.save = originals.queueSave;
    Resident.findOne = originals.residentFindOne;
    mailer.sendCustomResidentEmail = originals.sendEmail;
    sms.sendSmsNotification = originals.sendSms;
});

test('joinQueue uses the authenticated resident profile instead of request body identity', async () => {
    const resident = {
        _id: '665000000000000000000001',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        contactNumber: '+639171234567',
        email: 'juan@example.com'
    };
    const event = { _id: '665000000000000000000002', prefix: 'MED', isQueueOpen: true };
    let findOneCall = 0;
    let savedEntry;

    Resident.findOne = async () => resident;
    HealthEvent.findById = async () => event;
    HealthQueue.findOne = () => ({
        sort: async () => {
            findOneCall += 1;
            return null;
        }
    });
    HealthQueue.prototype.save = async function save() {
        savedEntry = this;
        this._id = '665000000000000000000003';
        return this;
    };
    HealthQueue.countDocuments = async () => 0;
    sms.sendSmsNotification = async () => ({ sent: true });
    mailer.sendCustomResidentEmail = async () => ({ sent: true });

    const req = {
        params: { eventId: '665000000000000000000002' },
        user: { id: '665000000000000000000004', role: 'resident', email: 'account@example.com' },
        body: {
            residentId: 'forged-resident',
            firstName: 'Forged',
            lastName: 'Name',
            contactNumber: '+639999999999'
        }
    };
    const res = createMockResponse();

    await controller.joinQueue(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(findOneCall, 2);
    assert.equal(String(savedEntry.residentId), resident._id);
    assert.equal(savedEntry.firstName, resident.firstName);
    assert.equal(savedEntry.contactNumber, resident.contactNumber);
    assert.equal(res.body.data.firstName, undefined);
});

test('listQueue redacts resident names and contact details for resident viewers', async () => {
    Resident.findOne = async () => ({ _id: 'resident-1' });
    HealthEvent.findById = async () => ({ _id: 'event-1', isQueueOpen: true, currentServing: 1 });
    HealthQueue.find = () => ({
        sort: async () => [{
            _id: 'queue-1',
            residentId: 'resident-1',
            queueNumber: 1,
            queueCode: 'MED-001',
            status: 'serving',
            firstName: 'Juan',
            lastName: 'Dela Cruz',
            contactNumber: '+639171234567'
        }]
    });

    const req = {
        params: { eventId: 'event-1' },
        user: { id: 'user-1', role: 'resident' }
    };
    const res = createMockResponse();

    await controller.listQueue(req, res);

    assert.equal(res.body.data[0].isMine, true);
    assert.equal(res.body.data[0].firstName, undefined);
    assert.equal(res.body.data[0].contactNumber, undefined);
    assert.equal(res.body.summary.current.queueCode, 'MED-001');
});

test('updateStatus sends turn notifications when staff manually serves a resident', async () => {
    const event = {
        _id: 'event-1',
        currentServing: 0,
        save: async () => event
    };
    const existing = {
        _id: 'queue-1',
        eventId: 'event-1',
        queueNumber: 1,
        queueCode: 'MED-001',
        status: 'waiting',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        contactNumber: '+639171234567',
        email: 'juan@example.com'
    };
    const served = {
        ...existing,
        status: 'serving',
        save: async () => served
    };
    let smsCalls = 0;
    let emailCalls = 0;

    HealthEvent.findById = async () => event;
    HealthQueue.findOne = (query) => {
        if (query.status === 'waiting' && query.notifiedApproaching === false) {
            return { sort: async () => null };
        }
        return Promise.resolve(existing);
    };
    HealthQueue.findOneAndUpdate = async () => served;
    HealthQueue.updateMany = async () => ({ modifiedCount: 0 });
    HealthQueue.find = () => ({ sort: async () => [served] });
    sms.sendSmsNotification = async () => {
        smsCalls += 1;
        return { sent: true };
    };
    mailer.sendCustomResidentEmail = async () => {
        emailCalls += 1;
        return { sent: true };
    };

    const req = {
        params: { eventId: 'event-1', queueId: 'queue-1' },
        body: { status: 'serving' },
        user: { role: 'bhw' }
    };
    const res = createMockResponse();

    await controller.updateStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(smsCalls, 1);
    assert.equal(emailCalls, 1);
    assert.equal(served.notifiedTurn, true);
});

test('updateStatus notifies the first waiting resident that they are next', async () => {
    const event = { _id: 'event-1', currentServing: 0, save: async () => event };
    const existing = {
        _id: 'queue-1',
        queueNumber: 1,
        queueCode: 'MED-001',
        status: 'waiting',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        contactNumber: '+639171234567',
        email: 'juan@example.com'
    };
    const served = { ...existing, status: 'serving', save: async () => served };
    const next = {
        _id: 'queue-2',
        queueNumber: 2,
        queueCode: 'MED-002',
        status: 'waiting',
        firstName: 'Maria',
        lastName: 'Santos',
        contactNumber: '+639181234567',
        email: 'maria@example.com',
        notifiedApproaching: false,
        save: async () => next
    };
    const messages = [];

    HealthEvent.findById = async () => event;
    HealthQueue.findOne = (query) => {
        if (query.status === 'waiting' && query.notifiedApproaching === false) {
            return { sort: async () => next };
        }
        return Promise.resolve(existing);
    };
    HealthQueue.findOneAndUpdate = async () => served;
    HealthQueue.updateMany = async () => ({ modifiedCount: 0 });
    HealthQueue.find = () => ({ sort: async () => [served, next] });
    sms.sendSmsNotification = async ({ messageContent }) => {
        messages.push(messageContent);
        return { sent: true };
    };
    mailer.sendCustomResidentEmail = async () => ({ sent: true });

    const req = {
        params: { eventId: 'event-1', queueId: 'queue-1' },
        body: { status: 'serving' },
        user: { role: 'bhw' }
    };
    const res = createMockResponse();

    await controller.updateStatus(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(next.notifiedApproaching, true);
    assert.equal(messages.some((message) => message.includes('you are next in line')), true);
});

test('deleteQueueEntry rejects deleting an active queue entry', async () => {
    HealthQueue.findOne = async () => ({ _id: 'queue-1', status: 'waiting' });

    const req = {
        params: { eventId: 'event-1', queueId: 'queue-1' },
        user: { role: 'admin' }
    };
    const res = createMockResponse();

    await controller.deleteQueueEntry(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
});
