const HealthEvent = require('../models/HealthEvent');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');

const createEvent = asyncHandler(async (req, res) => {
    const { title, description, prefix, eventDate, startTime, endTime } = req.body;

    if (!title || !prefix || !eventDate || !startTime || !endTime) {
        throw createHttpError(400, 'title, prefix, eventDate, startTime and endTime are required');
    }

    const event = new HealthEvent({
        title,
        description: description || '',
        prefix: String(prefix).toUpperCase(),
        eventDate: new Date(eventDate),
        startTime,
        endTime,
        createdBy: req.user?._id
    });

    await event.save();

    res.status(201).json({ success: true, message: 'Health event created', data: event });
});

const listEvents = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const events = await HealthEvent.find(query).sort({ eventDate: -1 });
    res.json({ success: true, data: events });
});

const getEvent = asyncHandler(async (req, res) => {
    const event = await HealthEvent.findById(req.params.id);
    if (!event) throw createHttpError(404, 'Event not found');
    res.json({ success: true, data: event });
});

const updateEvent = asyncHandler(async (req, res) => {
    const event = await HealthEvent.findById(req.params.id);
    if (!event) throw createHttpError(404, 'Event not found');

    const { title, description, prefix, eventDate, startTime, endTime, status } = req.body;
    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (prefix) event.prefix = String(prefix).toUpperCase();
    if (eventDate) event.eventDate = new Date(eventDate);
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (status) event.status = status;

    event.updatedAt = new Date();
    await event.save();

    res.json({ success: true, message: 'Event updated', data: event });
});

const toggleQueue = asyncHandler(async (req, res) => {
    const event = await HealthEvent.findById(req.params.id);
    if (!event) throw createHttpError(404, 'Event not found');

    const { open } = req.body; // boolean
    event.isQueueOpen = Boolean(open);
    if (event.isQueueOpen) event.status = 'ongoing';
    await event.save();

    res.json({ success: true, message: `Queue ${event.isQueueOpen ? 'opened' : 'closed'}`, data: event });
});

module.exports = {
    createEvent,
    listEvents,
    getEvent,
    updateEvent,
    toggleQueue
};
