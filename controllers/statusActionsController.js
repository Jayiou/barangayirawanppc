const FacilityReservation = require('../models/FacilityReservation');
const Report = require('../models/Report');
const DocumentRequest = require('../models/DocumentRequest');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { isValidTransition } = require('../utils/statusWorkflows');
const { logStatusChange } = require('../utils/statusLogger');
const { sendDocumentStatusEmail, sendRequestStatusEmail } = require('../utils/mailer');

const getPersonName = (person, fallback = 'Resident') => {
    const fullName = [
        person?.firstName,
        person?.middleName,
        person?.lastName,
        person?.suffix
    ].filter(Boolean).join(' ').trim();

    return fullName || person?.username || fallback;
};

const getRecipientEmail = (record) => (
    record?.email
    || record?.residentId?.email
    || record?.residentId?.userId?.email
    || record?.resident?.email
    || record?.resident?.userId?.email
    || record?.userId?.email
    || ''
);

const notifyRequestStatus = async (record, requestLabel, status, notes = '') => {
    const recipientEmail = getRecipientEmail(record);
    if (!recipientEmail) return;

    const requester = record?.residentId || record?.resident || record;
    await sendRequestStatusEmail(
        recipientEmail,
        getPersonName(requester, 'Resident'),
        requestLabel,
        status,
        notes
    );
};

const notifyDocumentStatus = async (documentRequest, status, notes = '') => {
    const recipientEmail = getRecipientEmail(documentRequest);
    if (!recipientEmail) return;

    await sendDocumentStatusEmail(
        recipientEmail,
        getPersonName(documentRequest.resident, 'Resident'),
        documentRequest.type,
        status,
        notes
    );
};

// ============ FACILITY RESERVATION ACTIONS ============

exports.approveFacilityReservation = asyncHandler(async (req, res) => {
    const res_obj = await FacilityReservation.findById(req.params.id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

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
    await notifyRequestStatus(res_obj, 'facility reservation', 'approved');

    res.json({ success: true, message: 'Facility reservation approved', data: res_obj });
});

exports.rejectFacilityReservation = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason?.trim()) {
        throw createHttpError(400, 'Reason for rejection is required');
    }

    const res_obj = await FacilityReservation.findById(req.params.id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

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
    await notifyRequestStatus(res_obj, 'facility reservation', 'rejected', reason);

    res.json({ success: true, message: 'Facility reservation rejected', data: res_obj });
});

exports.completeFacilityReservation = asyncHandler(async (req, res) => {
    const res_obj = await FacilityReservation.findById(req.params.id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

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
    await notifyRequestStatus(res_obj, 'facility reservation', 'completed');

    res.json({ success: true, message: 'Facility reservation marked as completed', data: res_obj });
});

// ============ DOCUMENT REQUEST ACTIONS ============

const updateDocumentRequestStatus = async (req, res, targetStatus, message) => {
    const { reason } = req.body;
    const documentRequest = await DocumentRequest.findById(req.params.id).populate({
        path: 'resident',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

    if (!documentRequest) {
        throw createHttpError(404, 'Document request not found');
    }

    if (targetStatus === 'rejected' && !reason?.trim()) {
        throw createHttpError(400, 'Reason for rejection is required');
    }

    if (!isValidTransition('documentRequest', documentRequest.status, targetStatus)) {
        throw createHttpError(400, `Cannot transition document request from ${documentRequest.status} to ${targetStatus}`);
    }

    const previousStatus = documentRequest.status;
    documentRequest.status = targetStatus;
    if (targetStatus === 'rejected') {
        documentRequest.adminNotes = reason;
    }
    await documentRequest.save();

    // Build detailed action description
    const residentName = documentRequest.resident 
        ? `${documentRequest.resident.firstName} ${documentRequest.resident.lastName}`
        : 'Unknown Resident';
    const actionDescription = `${documentRequest.type} document - ${targetStatus}${reason ? ` (${reason})` : ''}`;
    
    // Prepare additional data for audit log
    const additionalData = {
        documentType: documentRequest.type,
        residentName,
        residentId: documentRequest.resident?._id,
        purpose: documentRequest.purpose
    };

    await logStatusChange(
        'DocumentRequest',
        documentRequest._id,
        previousStatus,
        targetStatus,
        req.user,
        reason || '',
        req.ip,
        actionDescription,
        additionalData
    );
    await notifyDocumentStatus(documentRequest, targetStatus, reason || documentRequest.adminNotes || '');

    res.json({ success: true, message, data: documentRequest });
};

exports.approveDocumentRequest = asyncHandler(async (req, res) => {
    await updateDocumentRequestStatus(req, res, 'approved', 'Document request approved');
});

exports.rejectDocumentRequest = asyncHandler(async (req, res) => {
    await updateDocumentRequestStatus(req, res, 'rejected', 'Document request rejected');
});

exports.processDocumentRequest = asyncHandler(async (req, res) => {
    await updateDocumentRequestStatus(req, res, 'processing', 'Document request marked as processing');
});

exports.readyDocumentRequest = asyncHandler(async (req, res) => {
    await updateDocumentRequestStatus(req, res, 'ready_for_pickup', 'Document request marked as ready for pickup');
});

exports.completeDocumentRequest = asyncHandler(async (req, res) => {
    await updateDocumentRequestStatus(req, res, 'completed', 'Document request marked as completed');
});

// ============ REPORT ACTIONS ============

exports.startReviewReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

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
    await notifyRequestStatus(report, 'report', 'reviewing');

    res.json({ success: true, message: 'Report marked as reviewing', data: report });
});

exports.startProgressReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

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
    await notifyRequestStatus(report, 'report', 'in_progress');

    res.json({ success: true, message: 'Report marked as in progress', data: report });
});

exports.resolveReport = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

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
    await notifyRequestStatus(report, 'report', 'resolved');

    res.json({ success: true, message: 'Report marked as resolved', data: report });
});

exports.rejectReport = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason?.trim()) {
        throw createHttpError(400, 'Reason for rejection is required');
    }

    const report = await Report.findById(req.params.id).populate({
        path: 'residentId',
        select: 'firstName middleName lastName suffix email userId',
        populate: { path: 'userId', select: 'email username' }
    });

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
    await notifyRequestStatus(report, 'report', 'rejected', reason);

    res.json({ success: true, message: 'Report rejected', data: report });
});
