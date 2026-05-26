const SMSLog = require('../models/SMSLog');

// Truncate messages to single-SMS limits to reduce billing/credits.
const isBasicAscii = (text) => /^[\x00-\x7F]*$/.test(String(text || ''));
const singleSegmentLimit = (text) => (isBasicAscii(text) ? 160 : 70);
const truncateToSingleSegment = (text) => {
    const t = String(text || '');
    const limit = singleSegmentLimit(t);
    if (t.length <= limit) return t;
    return t.slice(0, Math.max(0, limit - 3)) + '...';
};

const formatLabel = (text) => {
    if (!text) return text;
    return text
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const sendDocumentStatusSMS = async (phoneNumber, name, documentType, status, referenceNumber) => {
    try {
        if (!process.env.SMS_ENABLED || process.env.SMS_ENABLED !== 'true') {
            console.log('SMS is disabled. Skipping SMS send.');
            return;
        }

        const docTypeFormatted = formatLabel(documentType);
        const statusFormatted = formatLabel(status);
        let messageContent = '';

        if (status === 'approved') {
            messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request is APPROVED. Please check your email for full details.${referenceNumber ? ' Ref: ' + referenceNumber : ''}`;
        } else if (status === 'processing') {
            messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request is PROCESSING. Please check your email for full details.`;
        } else if (status === 'ready_for_pickup') {
            messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} is READY FOR PICKUP. Please check your email for full details.`;
        } else if (status === 'rejected') {
            messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request was REJECTED. Please check your email for full details.`;
        } else if (status === 'completed') {
            messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request is COMPLETED. Please check your email for full details.`;
        } else {
            return;
        }
        // Truncate message to single-segment to save credits
        const truncated = truncateToSingleSegment(messageContent);

        // Save to SMS Log
        const smsLog = new SMSLog({
            phoneNumber,
            messageType: 'document_status',
            messageContent: truncated,
            referenceId: referenceNumber,
            status: 'sent'
        });

        await smsLog.save();
        console.log(`[SMS MOCK] Document Status SMS logged to ${phoneNumber}: "${truncated}"`);
    } catch (error) {
        console.error('Error logging document status SMS:', error);
    }
};

const sendStatusUpdateSMS = async (phoneNumber, name, status) => {
    try {
        if (!process.env.SMS_ENABLED || process.env.SMS_ENABLED !== 'true') {
            console.log('SMS is disabled. Skipping SMS send.');
            return;
        }

        let messageContent = '';

        if (status === 'approved') {
            messageContent = `Brgy Connect: Hi ${name}, your account is APPROVED. Please check your email for full details.`;
        } else if (status === 'rejected') {
            messageContent = `Brgy Connect: Hi ${name}, your account is REJECTED. Please check your email for full details.`;
        } else {
            return;
        }
        const truncated = truncateToSingleSegment(messageContent);
        // Save to SMS Log
        const smsLog = new SMSLog({
            phoneNumber,
            messageType: 'resident_approval',
            messageContent: truncated,
            status: 'sent'
        });

        await smsLog.save();
        console.log(`[SMS MOCK] Status Update SMS logged to ${phoneNumber}: "${truncated}"`);
    } catch (error) {
        console.error('Error logging status update SMS:', error);
    }
};

const sendAppointmentSMS = async (phoneNumber, name, appointmentDate, appointmentTime, purpose) => {
    try {
        if (!process.env.SMS_ENABLED || process.env.SMS_ENABLED !== 'true') {
            console.log('SMS is disabled. Skipping SMS send.');
            return;
        }

        const messageContent = `Brgy Connect: Hi ${name}, your Appointment request on ${appointmentDate} ${appointmentTime} is ${purpose || 'scheduled'}. Please check your email for full details. Ref: Appointment`;
        const truncated = truncateToSingleSegment(messageContent);

        // Save to SMS Log
        const smsLog = new SMSLog({
            phoneNumber,
            messageType: 'appointment_confirmation',
            messageContent: truncated,
            status: 'sent'
        });

        await smsLog.save();
        console.log(`[SMS MOCK] Appointment SMS logged to ${phoneNumber}: "${truncated}"`);
    } catch (error) {
        console.error('Error logging appointment SMS:', error);
    }
};

module.exports = {
    sendDocumentStatusSMS,
    sendStatusUpdateSMS,
    sendAppointmentSMS,
    formatLabel,
    truncateToSingleSegment
};
