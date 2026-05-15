const SMSLog = require('../models/SMSLog');

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
            messageContent = `Hello ${name}! Your request for ${docTypeFormatted} has been APPROVED. We are now preparing your document. - Barangay Connect`;
        } else if (status === 'processing') {
            messageContent = `Hello ${name}! Your request for ${docTypeFormatted} is now PROCESSING. Our staff is preparing your document. - Barangay Connect`;
        } else if (status === 'ready_for_pickup') {
            messageContent = `Great news ${name}! Your ${docTypeFormatted} is READY FOR PICKUP at the Barangay Hall. - Barangay Connect`;
        } else if (status === 'rejected') {
            messageContent = `Hello ${name}, unfortunately your request for ${docTypeFormatted} has been REJECTED. Please visit the Barangay Hall for more information. - Barangay Connect`;
        } else if (status === 'completed') {
            messageContent = `Thank you ${name}! Your request for ${docTypeFormatted} has been marked as COMPLETED. - Barangay Connect`;
        } else {
            return;
        }

        // Save to SMS Log
        const smsLog = new SMSLog({
            phoneNumber,
            messageType: 'document_status',
            messageContent,
            referenceId: referenceNumber,
            status: 'sent'
        });

        await smsLog.save();
        console.log(`[SMS MOCK] Document Status SMS sent to ${phoneNumber}: "${messageContent}"`);
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
            messageContent = `Congratulations ${name}! Your Barangay Connect account registration has been APPROVED. You can now login to the portal. - Barangay Connect`;
        } else if (status === 'rejected') {
            messageContent = `Hello ${name}, your Barangay Connect account registration has been REJECTED. Please ensure all details are correct and try again or visit the Barangay Hall. - Barangay Connect`;
        } else {
            return;
        }

        // Save to SMS Log
        const smsLog = new SMSLog({
            phoneNumber,
            messageType: 'resident_approval',
            messageContent,
            status: 'sent'
        });

        await smsLog.save();
        console.log(`[SMS MOCK] Status Update SMS sent to ${phoneNumber}: "${messageContent}"`);
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

        const messageContent = `Hi ${name}, your appointment at the Barangay Hall is scheduled for ${appointmentDate} at ${appointmentTime} for ${purpose}. - Barangay Connect`;

        // Save to SMS Log
        const smsLog = new SMSLog({
            phoneNumber,
            messageType: 'appointment_confirmation',
            messageContent,
            status: 'sent'
        });

        await smsLog.save();
        console.log(`[SMS MOCK] Appointment SMS sent to ${phoneNumber}: "${messageContent}"`);
    } catch (error) {
        console.error('Error logging appointment SMS:', error);
    }
};

module.exports = {
    sendDocumentStatusSMS,
    sendStatusUpdateSMS,
    sendAppointmentSMS,
    formatLabel
};
