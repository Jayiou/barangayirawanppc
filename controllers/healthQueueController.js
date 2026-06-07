const HealthQueue = require('../models/HealthQueue');
const HealthEvent = require('../models/HealthEvent');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const mailer = require('../utils/mailer');
const sms = require('../utils/sms');

const pad = (n, width = 3) => String(n).padStart(width, '0');

const joinQueue = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const { requesterType = 'resident', residentId, firstName, lastName, contactNumber, email } = req.body;

    if (!firstName || !lastName || !contactNumber) {
        throw createHttpError(400, 'firstName, lastName and contactNumber are required');
    }

    const event = await HealthEvent.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');
    if (!event.isQueueOpen) throw createHttpError(400, 'Queue is not open for this event');

    // determine next queue number
    const last = await HealthQueue.findOne({ eventId }).sort({ queueNumber: -1 });
    const nextNumber = last ? (last.queueNumber + 1) : 1;
    const queueCode = `${event.prefix}-${pad(nextNumber)}`;

    const entry = new HealthQueue({
        eventId,
        requesterType,
        residentId: requesterType === 'resident' ? residentId : undefined,
        firstName,
        lastName,
        contactNumber,
        email: email || '',
        queueNumber: nextNumber,
        queueCode
    });

    await entry.save();

    res.status(201).json({ success: true, message: 'Joined queue', data: entry });
});

const listQueue = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const items = await HealthQueue.find({ eventId }).sort({ queueNumber: 1 });
    res.json({ success: true, data: items });
});

const callNext = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const threshold = Number(req.body.threshold || 3);

    const event = await HealthEvent.findById(eventId);
    if (!event) throw createHttpError(404, 'Event not found');
    if (!event.isQueueOpen) throw createHttpError(400, 'Queue is not open for this event');

    // advance current serving
    event.currentServing = (event.currentServing || 0) + 1;
    await event.save();

    // mark the queue item as serving
    const current = await HealthQueue.findOneAndUpdate(
        { eventId, queueNumber: event.currentServing },
        { status: 'serving' },
        { new: true }
    );

    // notify the person at turn
    if (current) {
        const message = `Brgy Irawan: Hi ${current.firstName}, it's your turn now. Please proceed to the Health Center. (${current.queueCode})`;
        try { await sms.sendSmsNotification({ phoneNumber: current.contactNumber, messageType: 'health_queue_turn', messageContent: message, recipientId: current._id, referenceId: eventId }); } catch (e) { console.error(e); }
        try { if (current.email) await mailer.sendCustomResidentEmail(current.email, `${current.firstName} ${current.lastName}`, 'Health Center - Your Turn', message); } catch (e) { console.error(e); }
        current.notifiedTurn = true;
        await current.save();
    }

    // notify approaching threshold (e.g., 3 away)
    const approachingNumber = event.currentServing + threshold;
    const approaching = await HealthQueue.findOne({ eventId, queueNumber: approachingNumber, notifiedApproaching: false });
    if (approaching) {
        const appMsg = `Brgy Irawan: Hi ${approaching.firstName}, your turn is approaching. ${threshold - 1} people ahead of you. (${approaching.queueCode})`;
        try { await sms.sendSmsNotification({ phoneNumber: approaching.contactNumber, messageType: 'health_queue_approaching', messageContent: appMsg, recipientId: approaching._id, referenceId: eventId }); } catch (e) { console.error(e); }
        try { if (approaching.email) await mailer.sendCustomResidentEmail(approaching.email, `${approaching.firstName} ${approaching.lastName}`, 'Health Center - Approaching', appMsg); } catch (e) { console.error(e); }
        approaching.notifiedApproaching = true;
        await approaching.save();
    }

    res.json({ success: true, message: 'Called next', data: { current, event } });
});

module.exports = {
    joinQueue,
    listQueue,
    callNext
};
