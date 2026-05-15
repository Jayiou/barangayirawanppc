const DocumentRequest = require('../models/DocumentRequest');
const FacilityReservation = require('../models/FacilityReservation');
const Report = require('../models/Report');
const User = require('../models/User');
const Resident = require('../models/Resident');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { isValidTransition } = require('../utils/statusWorkflows');
const { logStatusChange } = require('../utils/statusLogger');
const { sendDocumentStatusEmail, sendStatusUpdateEmail } = require('../utils/mailer');
const { sendDocumentStatusSMS, sendStatusUpdateSMS } = require('../utils/sms');

// ============ DOCUMENT REQUEST ACTIONS ============

exports.approveDocumentRequest = asyncHandler(async (req, res) => {
    const doc = await DocumentRequest.findById(req.params.id).populate('residentId');

    if (!doc) {
        throw createHttpError(404, 'Document request not found');
    }

    if (!isValidTransition('documentRequest', doc.status, 'approved')) {
        throw createHttpError(400, `Cannot approve document with status: ${doc.status}`);
    }

    const previousStatus = doc.status;
    doc.status = 'approved';
    await doc.save();

    // Log change
    await logStatusChange('DocumentRequest', doc._id, previousStatus, 'approved', req.user, '', req.ip);

    // Send notifications
    const resident = await Resident.findById(doc.residentId).populate('userId');
    if (resident) {
        const email = resident.userId?.email || resident.email;
        const phone = resident.contactNumber;
        const fullName = `${resident.firstName} ${resident.lastName}`;

        if (email) {
            await sendDocumentStatusEmail(email, fullName, doc.documentType, 'approved', '');
        }
        if (phone) {
            await sendDocumentStatusSMS(phone, fullName, doc.documentType, 'approved', doc._id.toString());
        }
    }

    res.json({ success: true, message: 'Document approved', data: doc });
});

exports.rejectDocumentRequest = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        throw createHttpError(400, 'Reason for rejection is required');
    }

    const doc = await DocumentRequest.findById(req.params.id).populate('residentId');

    if (!doc) {
        throw createHttpError(404, 'Document request not found');
    }

    if (!isValidTransition('documentRequest', doc.status, 'rejected')) {
        throw createHttpError(400, `Cannot reject document with status: ${doc.status}`);
    }

    const previousStatus = doc.status;
    doc.status = 'rejected';
    doc.adminNotes = reason;
    await doc.save();

    // Log change
    await logStatusChange('DocumentRequest', doc._id, previousStatus, 'rejected', req.user, reason, req.ip);

    // Send notifications
    const resident = await Resident.findById(doc.residentId).populate('userId');
    if (resident) {
        const email = resident.userId?.email || resident.email;
        const phone = resident.contactNumber;
        const fullName = `${resident.firstName} ${resident.lastName}`;

        if (email) {
            await sendDocumentStatusEmail(email, fullName, doc.documentType, 'rejected', reason);
        }
        if (phone) {
            await sendDocumentStatusSMS(phone, fullName, doc.documentType, 'rejected', doc._id.toString());
        }
    }

    res.json({ success: true, message: 'Document rejected', data: doc });
});

exports.markDocumentProcessing = asyncHandler(async (req, res) => {
    const doc = await DocumentRequest.findById(req.params.id);

    if (!doc) {
        throw createHttpError(404, 'Document request not found');
    }

    if (!isValidTransition('documentRequest', doc.status, 'processing')) {
        throw createHttpError(400, `Cannot mark as processing from status: ${doc.status}`);
    }

    const previousStatus = doc.status;
    doc.status = 'processing';
    await doc.save();

    // Log change
    await logStatusChange('DocumentRequest', doc._id, previousStatus, 'processing', req.user, '', req.ip);

    // Send notification
    const resident = await Resident.findById(doc.residentId).populate('userId');
    if (resident) {
        const email = resident.userId?.email || resident.email;
        const phone = resident.contactNumber;
        const fullName = `${resident.firstName} ${resident.lastName}`;

        if (email) {
            await sendDocumentStatusEmail(email, fullName, doc.documentType, 'processing', '');
        }
        if (phone) {
            await sendDocumentStatusSMS(phone, fullName, doc.documentType, 'processing', doc._id.toString());
        }
    }

    res.json({ success: true, message: 'Document marked as processing', data: doc });
});

exports.markDocumentReadyPickup = asyncHandler(async (req, res) => {
    const doc = await DocumentRequest.findById(req.params.id).populate('residentId');

    if (!doc) {
        throw createHttpError(404, 'Document request not found');
    }

    if (!isValidTransition('documentRequest', doc.status, 'ready_for_pickup')) {
        throw createHttpError(400, `Cannot mark as ready from status: ${doc.status}`);
    }

    const previousStatus = doc.status;
    doc.status = 'ready_for_pickup';
    await doc.save();

    // Log change
    await logStatusChange('DocumentRequest', doc._id, previousStatus, 'ready_for_pickup', req.user, '', req.ip);

    // Send notification
    const resident = await Resident.findById(doc.residentId).populate('userId');
    if (resident) {
        const email = resident.userId?.email || resident.email;
        const phone = resident.contactNumber;
        const fullName = `${resident.firstName} ${resident.lastName}`;

        if (email) {
            await sendDocumentStatusEmail(email, fullName, doc.documentType, 'ready_for_pickup', '');
        }
        if (phone) {
            await sendDocumentStatusSMS(phone, fullName, doc.documentType, 'ready_for_pickup', doc._id.toString());
        }
    }

    res.json({ success: true, message: 'Document marked as ready for pickup', data: doc });
});

exports.completeDocumentRequest = asyncHandler(async (req, res) => {
    const doc = await DocumentRequest.findById(req.params.id).populate('residentId');

    if (!doc) {
        throw createHttpError(404, 'Document request not found');
    }

    if (!isValidTransition('documentRequest', doc.status, 'completed')) {
        throw createHttpError(400, `Cannot complete from status: ${doc.status}`);
    }

    const previousStatus = doc.status;
    doc.status = 'completed';
    await doc.save();

    // Log change
    await logStatusChange('DocumentRequest', doc._id, previousStatus, 'completed', req.user, '', req.ip);

    // Send notification
    const resident = await Resident.findById(doc.residentId).populate('userId');
    if (resident) {
        const email = resident.userId?.email || resident.email;
        const phone = resident.contactNumber;
        const fullName = `${resident.firstName} ${resident.lastName}`;

        if (email) {
            await sendDocumentStatusEmail(email, fullName, doc.documentType, 'completed', '');
        }
        if (phone) {
            await sendDocumentStatusSMS(phone, fullName, doc.documentType, 'completed', doc._id.toString());
        }
    }

    res.json({ success: true, message: 'Document marked as completed', data: doc });
});

// ============ FACILITY RESERVATION ACTIONS ============

exports.approveFacilityReservation = asyncHandler(async (req, res) => {
    const res_obj = await FacilityReservation.findById(req.params.id);

    if (!res_obj) {
        throw createHttpError(404, 'Facility reservation not found');
    }

    if (!isValidTransition('facilityReservation', res_obj.status, 'approved')) {
        throw createHttpError(400, `Cannot approve reservation with status: ${res_obj.status}`);
    }

    const previousStatus = res_obj.status;
    res_obj.status = 'approved';
    await res_obj.save();

    // Log change
    await logStatusChange('FacilityReservation', res_obj._id, previousStatus, 'approved', req.user, '', req.ip);

    res.json({ success: true, message: 'Facility reservation approved', data: res_obj });
});

exports.rejectFacilityReservation = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        throw createHttpError(400, 'Reason for rejection is required');
    }

    const res_obj = await FacilityReservation.findById(req.params.id);

    if (!res_obj) {
        throw createHttpError(404, 'Facility reservation not found');
    }

    if (!isValidTransition('facilityReservation', res_obj.status, 'rejected')) {
        throw createHttpError(400, `Cannot reject reservation with status: ${res_obj.status}`);
    }

    const previousStatus = res_obj.status;
    res_obj.status = 'rejected';
    res_obj.adminNotes = reason;
    await res_obj.save();

    // Log change
    await logStatusChange('FacilityReservation', res_obj._id, previousStatus, 'rejected', req.user, reason, req.ip);

    res.json({ success: true, message: 'Facility reservation rejected', data: res_obj });
});

exports.completeFacilityReservation = asyncHandler(async (req, res) => {
    const res_obj = await FacilityReservation.findById(req.params.id);

    if (!res_obj) {
        throw createHttpError(404, 'Facility reservation not found');
    }

    if (!isValidTransition('facilityReservation', res_obj.status, 'completed')) {
        throw createHttpError(400, `Cannot complete reservation from status: ${res_obj.status}`);
    }

    const previousStatus = res_obj.status;
    res_obj.status = 'completed';
    await res_obj.save();

    // Log change
    await logStatusChange('FacilityReservation', res_obj._id, previousStatus, 'completed', req.user, '', req.ip);

    res.json({ success: true, message: 'Facility reservation marked as completed', data: res_obj });
});

// ============ REPORT ACTIONS ============

exports.startReviewReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        throw createHttpError(404, 'Report not found');
    }

    if (!isValidTransition('report', report.status, 'reviewing')) {
        throw createHttpError(400, `Cannot review report with status: ${report.status}`);
    }

    const previousStatus = report.status;
    report.status = 'reviewing';
    await report.save();

    // Log change
    await logStatusChange('Report', report._id, previousStatus, 'reviewing', req.user, '', req.ip);

    res.json({ success: true, message: 'Report marked as reviewing', data: report });
});

exports.startProgressReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        throw createHttpError(404, 'Report not found');
    }

    if (!isValidTransition('report', report.status, 'in_progress')) {
        throw createHttpError(400, `Cannot mark in progress from status: ${report.status}`);
    }

    const previousStatus = report.status;
    report.status = 'in_progress';
    await report.save();

    // Log change
    await logStatusChange('Report', report._id, previousStatus, 'in_progress', req.user, '', req.ip);

    res.json({ success: true, message: 'Report marked as in progress', data: report });
});

exports.resolveReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        throw createHttpError(404, 'Report not found');
    }

    if (!isValidTransition('report', report.status, 'resolved')) {
        throw createHttpError(400, `Cannot resolve report from status: ${report.status}`);
    }

    const previousStatus = report.status;
    report.status = 'resolved';
    await report.save();

    // Log change
    await logStatusChange('Report', report._id, previousStatus, 'resolved', req.user, '', req.ip);

    res.json({ success: true, message: 'Report marked as resolved', data: report });
});

exports.rejectReport = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
        throw createHttpError(400, 'Reason for rejection is required');
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
        throw createHttpError(404, 'Report not found');
    }

    if (!isValidTransition('report', report.status, 'rejected')) {
        throw createHttpError(400, `Cannot reject report with status: ${report.status}`);
    }

    const previousStatus = report.status;
    report.status = 'rejected';
    report.adminNotes = reason;
    await report.save();

    // Log change
    await logStatusChange('Report', report._id, previousStatus, 'rejected', req.user, reason, req.ip);

    res.json({ success: true, message: 'Report rejected', data: report });
});
