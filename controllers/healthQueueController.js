const HealthQueue = require('../models/HealthQueue');
const HealthEvent = require('../models/HealthEvent');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');

const pad = (n, width = 3) => String(n).padStart(width, '0');
const ACTIVE_QUEUE_STATUSES = ['waiting', 'serving'];
const TERMINAL_QUEUE_STATUSES = ['completed', 'no-show', 'cancelled'];
const STATUS_TRANSITIONS = new Set(['waiting', 'serving', ...TERMINAL_QUEUE_STATUSES]);

const buildQueueSummary = (items, event) => {
    const counts = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {});
    const current = items.find((item) => item.status === 'serving') || null;
    const next = items.find((item) => item.status === 'waiting') || null;

    return {
        total: items.length,
        waiting: counts.waiting || 0,
        serving: counts.serving || 0,
        completed: counts.completed || 0,
        noShow: counts['no-show'] || 0,
        cancelled: counts.cancelled || 0,
        currentServing: event?.currentServing || 0,
        isQueueOpen: Boolean(event?.isQueueOpen),
        current,
        next
    };
};

const getQueueWithSummary = async (eventId) => {
    const [event, items] = await Promise.all([
        HealthEvent.findById(eventId),
        HealthQueue.find({ eventId }).sort({ queueNumber: 1 })
    ]);

    if (!event) throw createHttpError(404, 'Event not found');
    return { event, items, summary: buildQueueSummary(items, event) };
};

const reserveQueueNumber = async (event, payload, attempts = 3) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const last = await HealthQueue.findOne({ eventId: event._id }).sort({ queueNumber: -1 });
        const nextNumber = last ? (last.queueNumber + 1) : 1;
        const entry = new HealthQueue({
            ...payload,
            queueNumber: nextNumber,
            queueCode: `${event.prefix}-${pad(nextNumber)}`
        });

        try {
            await entry.save();
            return entry;
        } catch (err) {
            if (err?.code !== 11000 || attempt === attempts - 1) {
                throw err;
            }
        }
    }

    throw createHttpError(409, 'Unable to reserve queue number. Please try again.');
};

const joinQueue = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { residentId, firstName, lastName, contactNumber, email } = req.body;

    if (!residentId) {
        throw createHttpError(400, 'residentId is required');
    }

    if (!firstName || !lastName || !contactNumber) {
        throw createHttpError(400, 'firstName, lastName and contactNumber are required');
    }

    const event = await HealthEvent.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');
    if (!event.isQueueOpen) throw createHttpError(400, 'Queue is not open for this event');

    const existing = await HealthQueue.findOne({
        eventId,
        residentId,
        status: { $in: ACTIVE_QUEUE_STATUSES }
    }).sort({ queueNumber: 1 });
    if (existing) {
        res.status(200).json({ success: true, message: 'You are already in this queue', data: existing });
        return;
    }

    const entry = await reserveQueueNumber(event, {
        eventId,
        requesterType: 'resident',
        residentId,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        contactNumber: String(contactNumber).trim(),
        email: email || '',
        status: 'waiting'
    });

    res.status(201).json({ success: true, message: 'Joined queue', data: entry });
});

const listQueue = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { event, items, summary } = await getQueueWithSummary(eventId);
    res.json({ success: true, data: items, event, summary });
});

const getSummary = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { event, summary } = await getQueueWithSummary(eventId);
    res.json({ success: true, data: summary, event });
});

const callNext = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const threshold = Math.max(1, Number(req.body.threshold || 3));

    const event = await HealthEvent.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');
    if (!event.isQueueOpen) throw createHttpError(400, 'Queue is not open for this event');

    await HealthQueue.updateMany(
        { eventId, status: 'serving' },
        { status: 'completed', completedAt: new Date() }
    );

    const current = await HealthQueue.findOneAndUpdate(
        { eventId, status: 'waiting' },
        { status: 'serving', servedAt: new Date() },
        { new: true, sort: { queueNumber: 1 } }
    );

    if (!current) {
        const { summary } = await getQueueWithSummary(eventId);
        res.json({ success: true, message: 'No waiting queue entries', data: { current: null, event, summary } });
        return;
    }

    event.currentServing = current.queueNumber;
    await event.save();

    const message = `Brgy Irawan: Hi ${current.firstName}, it's your turn now. Please proceed to the Health Center. (${current.queueCode})`;
    try { await sms.sendSmsNotification({ phoneNumber: current.contactNumber, messageType: 'health_queue_turn', messageContent: message, recipientId: current._id, referenceId: eventId }); } catch (e) { console.error(e); }
    try { if (current.email) await mailer.sendCustomResidentEmail(current.email, `${current.firstName} ${current.lastName}`, 'Health Center - Your Turn', message); } catch (e) { console.error(e); }
    current.notifiedTurn = true;
    await current.save();

    const approachingNumber = current.queueNumber + threshold;
    const approaching = await HealthQueue.findOne({ eventId, queueNumber: approachingNumber, notifiedApproaching: false });
    if (approaching) {
        const appMsg = `Brgy Irawan: Hi ${approaching.firstName}, your turn is approaching. ${threshold - 1} people ahead of you. (${approaching.queueCode})`;
        try { await sms.sendSmsNotification({ phoneNumber: approaching.contactNumber, messageType: 'health_queue_approaching', messageContent: appMsg, recipientId: approaching._id, referenceId: eventId }); } catch (e) { console.error(e); }
        try { if (approaching.email) await mailer.sendCustomResidentEmail(approaching.email, `${approaching.firstName} ${approaching.lastName}`, 'Health Center - Approaching', appMsg); } catch (e) { console.error(e); }
        approaching.notifiedApproaching = true;
        await approaching.save();
    }

    const { summary } = await getQueueWithSummary(eventId);
    res.json({ success: true, message: 'Called next', data: { current, event, summary } });
});

const updateStatus = asyncHandler(async (req, res) => {
    const { eventId, queueId } = req.params;
    const { status } = req.body;

    if (!STATUS_TRANSITIONS.has(status)) {
        throw createHttpError(400, 'Invalid queue status');
    }

    const event = await HealthEvent.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');

    const update = { status };
    if (status === 'serving') update.servedAt = new Date();
    if (TERMINAL_QUEUE_STATUSES.includes(status)) update.completedAt = new Date();

    const item = await HealthQueue.findOneAndUpdate(
        { _id: queueId, eventId },
        update,
        { new: true }
    );
    if (!item) throw createHttpError(404, 'Queue entry not found');

    if (status === 'serving') {
        await HealthQueue.updateMany(
            { eventId, _id: { $ne: item._id }, status: 'serving' },
            { status: 'completed', completedAt: new Date() }
        );
        event.currentServing = item.queueNumber;
        await event.save();
    }

    const { summary } = await getQueueWithSummary(eventId);
    res.json({ success: true, message: 'Queue status updated', data: item, summary });
});

module.exports = {
    joinQueue,
    listQueue,
    getSummary,
    callNext,
    updateStatus
};
