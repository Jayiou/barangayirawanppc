const HealthQueue = require('../models/HealthQueue');
const HealthEvent = require('../models/HealthEvent');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');

const pad = (n, width = 3) => String(n).padStart(width, '0');
const TERMINAL_QUEUE_STATUSES = ['completed', 'no-show', 'cancelled'];
const STATUS_TRANSITIONS = new Set(['waiting', 'serving', ...TERMINAL_QUEUE_STATUSES]);
const ALLOWED_STATUS_TRANSITIONS = {
    waiting: new Set(['serving', 'cancelled', 'no-show']),
    serving: new Set(['completed', 'no-show', 'cancelled']),
    completed: new Set(),
    'no-show': new Set(),
    cancelled: new Set()
};

const getUserId = (req) => req.user?._id || req.user?.id;
const isQueueStaff = (req) => ['admin', 'bhw'].includes(req.user?.role);
const sameId = (a, b) => a && b && String(a) === String(b);

const toQueueItem = (item, { staff = false, residentId = null } = {}) => {
    if (!item) return null;
    const isMine = sameId(item.residentId, residentId);
    const base = {
        _id: item._id,
        queueNumber: item.queueNumber,
        queueCode: item.queueCode,
        status: item.status,
        isMine
    };

    if (!staff) return base;

    return {
        ...base,
        requesterType: item.requesterType,
        residentId: item.residentId,
        userId: item.userId,
        firstName: item.firstName,
        lastName: item.lastName,
        contactNumber: item.contactNumber,
        email: item.email,
        notifiedApproaching: item.notifiedApproaching,
        notifiedTurn: item.notifiedTurn,
        servedAt: item.servedAt,
        completedAt: item.completedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
};

const buildQueueSummary = (items, event, viewer = {}) => {
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
        current: toQueueItem(current, viewer),
        next: toQueueItem(next, viewer)
    };
};

const getQueueWithSummary = async (eventId, viewer = {}) => {
    const [event, items] = await Promise.all([
        HealthEvent.findById(eventId),
        HealthQueue.find({ eventId }).sort({ queueNumber: 1 })
    ]);

    if (!event) throw createHttpError(404, 'Event not found');
    return { event, items, summary: buildQueueSummary(items, event, viewer) };
};

const getResidentForRequest = async (req) => {
    const userId = getUserId(req);
    if (!userId) throw createHttpError(401, 'Authentication is required');

    const resident = await Resident.findOne({ userId });
    if (!resident) {
        throw createHttpError(404, 'Please complete your resident profile before joining a queue.');
    }

    return resident;
};

const refreshCurrentServing = async (eventId, event) => {
    const serving = await HealthQueue.findOne({ eventId, status: 'serving' }).sort({ queueNumber: 1 });
    event.currentServing = serving?.queueNumber || 0;
    await event.save();
};

const notifyQueueTurn = async (entry, eventId) => {
    const message = `Brgy Irawan: Hi ${entry.firstName}, it's your turn now. Please proceed to the Health Center. (${entry.queueCode})`;
    const smsResult = await sms.sendSmsNotification({
        phoneNumber: entry.contactNumber,
        messageType: 'health_queue_turn',
        messageContent: message,
        recipientId: entry._id,
        referenceId: eventId
    }).catch((error) => ({ sent: false, error }));
    const emailResult = entry.email
        ? await mailer.sendCustomResidentEmail(
            entry.email,
            `${entry.firstName} ${entry.lastName}`,
            'Health Center - Your Turn',
            message
        )
        : { sent: false, skipped: true, reason: 'missing_email' };

    entry.notifiedTurn = Boolean(smsResult?.sent || emailResult?.sent);
    await entry.save();
    return { sms: smsResult, email: emailResult };
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
    const resident = await getResidentForRequest(req);
    const contactNumber = String(resident.contactNumber || '').trim();

    const event = await HealthEvent.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');
    if (!event.isQueueOpen) throw createHttpError(400, 'Queue is not open for this event');
    if (!contactNumber) {
        throw createHttpError(400, 'Please add a contact number to your resident profile before joining a queue.');
    }

    const existing = await HealthQueue.findOne({
        eventId,
        residentId: resident._id
    }).sort({ queueNumber: 1 });
    if (existing) {
        res.status(200).json({
            success: true,
            duplicate: true,
            message: `You already joined this event. Your number is ${existing.queueCode}.`,
            data: toQueueItem(existing, { residentId: resident._id })
        });
        return;
    }

    const entry = await reserveQueueNumber(event, {
        eventId,
        requesterType: 'resident',
        residentId: resident._id,
        userId: getUserId(req),
        firstName: String(resident.firstName || '').trim(),
        lastName: String(resident.lastName || '').trim(),
        contactNumber,
        email: resident.email || req.user?.email || '',
        status: 'waiting'
    });

    res.status(201).json({ success: true, duplicate: false, message: `Joined queue. Your number is ${entry.queueCode}.`, data: toQueueItem(entry, { residentId: resident._id }) });
});

const listQueue = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    let residentId = null;
    if (!isQueueStaff(req) && req.user?.role === 'resident') {
        const resident = await Resident.findOne({ userId: getUserId(req) });
        residentId = resident?._id || null;
    }

    const viewer = { staff: isQueueStaff(req), residentId };
    const { event, items, summary } = await getQueueWithSummary(eventId, viewer);
    res.json({ success: true, data: items.map((item) => toQueueItem(item, viewer)), event, summary });
});

const getSummary = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { event, summary } = await getQueueWithSummary(eventId, { staff: true });
    res.json({ success: true, data: summary, event });
});

const callNext = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const threshold = Math.max(1, Number(req.body.threshold || 3));

    const event = await HealthEvent.findOneAndUpdate(
        { _id: eventId, queueLock: { $ne: true } },
        { queueLock: true },
        { new: true }
    );
    if (!event) throw createHttpError(409, 'Queue is busy. Please try again.');

    try {
        if (!event.isQueueOpen) {
            throw createHttpError(400, 'Queue is not open for this event');
        }

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
            event.currentServing = 0;
            await event.save();
            const { summary } = await getQueueWithSummary(eventId, { staff: true });
            res.json({ success: true, message: 'No waiting queue entries', data: { current: null, event, summary } });
            return;
        }

        event.currentServing = current.queueNumber;
        await event.save();

        await notifyQueueTurn(current, eventId);

        const approachingNumber = current.queueNumber + threshold;
        const approaching = await HealthQueue.findOne({ eventId, queueNumber: approachingNumber, notifiedApproaching: false });
        if (approaching) {
            const appMsg = `Brgy Irawan: Hi ${approaching.firstName}, your turn is approaching. ${threshold - 1} people ahead of you. (${approaching.queueCode})`;
            const smsResult = await sms.sendSmsNotification({ phoneNumber: approaching.contactNumber, messageType: 'health_queue_approaching', messageContent: appMsg, recipientId: approaching._id, referenceId: eventId })
                .catch((error) => ({ sent: false, error }));
            const emailResult = approaching.email
                ? await mailer.sendCustomResidentEmail(approaching.email, `${approaching.firstName} ${approaching.lastName}`, 'Health Center - Approaching', appMsg)
                : { sent: false, skipped: true, reason: 'missing_email' };
            approaching.notifiedApproaching = Boolean(smsResult?.sent || emailResult?.sent);
            await approaching.save();
        }

        const { summary } = await getQueueWithSummary(eventId, { staff: true });
        res.json({ success: true, message: 'Called next', data: { current: toQueueItem(current, { staff: true }), event, summary } });
    } finally {
        event.queueLock = false;
        await event.save();
    }
});

const updateStatus = asyncHandler(async (req, res) => {
    const { eventId, queueId } = req.params;
    const { status } = req.body;

    if (!STATUS_TRANSITIONS.has(status)) {
        throw createHttpError(400, 'Invalid queue status');
    }

    const event = await HealthEvent.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');

    const existing = await HealthQueue.findOne({ _id: queueId, eventId });
    if (!existing) throw createHttpError(404, 'Queue entry not found');
    if (existing.status === status) {
        const { summary } = await getQueueWithSummary(eventId, { staff: true });
        res.json({ success: true, message: 'Queue status unchanged', data: toQueueItem(existing, { staff: true }), summary });
        return;
    }
    if (!ALLOWED_STATUS_TRANSITIONS[existing.status]?.has(status)) {
        throw createHttpError(400, `Cannot change queue status from ${existing.status} to ${status}`);
    }

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
        await notifyQueueTurn(item, eventId);
    } else if (existing.status === 'serving' && TERMINAL_QUEUE_STATUSES.includes(status)) {
        await refreshCurrentServing(eventId, event);
    }

    const { summary } = await getQueueWithSummary(eventId, { staff: true });
    res.json({ success: true, message: 'Queue status updated', data: toQueueItem(item, { staff: true }), summary });
});

module.exports = {
    joinQueue,
    listQueue,
    getSummary,
    callNext,
    updateStatus
};
