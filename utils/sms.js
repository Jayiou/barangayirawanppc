const twilio = require('twilio');
const SMSLog = require('../models/SMSLog');

const smsRuntime = {
    env: process.env,
    logger: console,
    smsLogModel: SMSLog,
    twilioClientFactory: null,
    twilioClient: null
};

const configureSmsRuntime = (overrides = {}) => {
    Object.assign(smsRuntime, overrides);
};

const resetSmsRuntime = () => {
    smsRuntime.env = process.env;
    smsRuntime.logger = console;
    smsRuntime.smsLogModel = SMSLog;
    smsRuntime.twilioClientFactory = null;
    smsRuntime.twilioClient = null;
};

const getEnv = () => smsRuntime.env || process.env;
const getLogger = () => smsRuntime.logger || console;

const logAtLevel = (level, ...args) => {
    const logger = getLogger();
    const loggerMethod = logger[level] || logger.log || console.log;
    return loggerMethod.apply(logger, args);
};

// Truncate messages to single-SMS limits to reduce billing/credits.
const isBasicAscii = (text) => /^[\x00-\x7F]*$/.test(String(text || ''));
const singleSegmentLimit = (text) => (isBasicAscii(text) ? 160 : 70);
const truncateToSingleSegment = (text) => {
    const value = String(text || '');
    const limit = singleSegmentLimit(value);
    if (value.length <= limit) return value;
    return value.slice(0, Math.max(0, limit - 3)) + '...';
};

const formatLabel = (text) => {
    if (!text) return text;
    return text
    .split('_')
    .join(' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const normalizePhoneNumber = (value) => String(value || '')
    .replace(/[\s()-]/g, '')
    .trim();

const toE164PhoneNumber = (value) => {
    const normalized = normalizePhoneNumber(value);
    if (!normalized) return '';

    // Keep only leading plus and digits for provider-safe parsing.
    const cleaned = normalized
        .replace(/(?!^)[+]/g, '')
        .replace(/[^\d+]/g, '');

    if (!cleaned) return '';

    let candidate = cleaned;

    // Handle international prefix format like 0063...
    if (candidate.startsWith('00')) {
        candidate = '+' + candidate.slice(2);
    }

    // Common PH local formats: 09XXXXXXXXX or 9XXXXXXXXX
    if (/^09\d{9}$/.test(candidate)) {
        candidate = '+63' + candidate.slice(1);
    } else if (/^9\d{9}$/.test(candidate)) {
        candidate = '+63' + candidate;
    } else if (/^63\d{10}$/.test(candidate)) {
        candidate = '+' + candidate;
    }

    // Strict E.164 validation after normalization.
    if (!/^\+[1-9]\d{7,14}$/.test(candidate)) {
        return '';
    }

    return candidate;
};

const isSmsEnabled = () => String(getEnv().SMS_ENABLED || '').toLowerCase() === 'true';

const getTwilioConfig = () => {
    const env = getEnv();
    const accountSid = String(env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = String(env.TWILIO_AUTH_TOKEN || '').trim();
    const fromNumber = String(env.TWILIO_NUMBER || '').trim();

    return {
        accountSid,
        authToken,
        fromNumber,
        isConfigured: Boolean(accountSid && authToken && fromNumber)
    };
};

const getTwilioClient = () => {
    if (smsRuntime.twilioClient) {
        return smsRuntime.twilioClient;
    }

    if (typeof smsRuntime.twilioClientFactory === 'function') {
        smsRuntime.twilioClient = smsRuntime.twilioClientFactory();
        return smsRuntime.twilioClient;
    }

    const { accountSid, authToken } = getTwilioConfig();
    smsRuntime.twilioClient = twilio(accountSid, authToken);
    return smsRuntime.twilioClient;
};

const saveSmsLog = async ({
    phoneNumber,
    messageType,
    messageContent,
    status,
    recipientId,
    referenceId = '',
    provider = 'twilio',
    providerMessageId = '',
    providerStatus = '',
    providerError = '',
    providerErrorCode = ''
}) => {
    const smsLogModel = smsRuntime.smsLogModel || SMSLog;
    const smsLog = new smsLogModel({
        phoneNumber,
        messageType,
        messageContent,
        recipientId,
        referenceId,
        status,
        provider,
        providerMessageId,
        providerStatus,
        providerError,
        providerErrorCode
    });

    return smsLog.save();
};

const sendSmsNotification = async ({
    phoneNumber,
    messageType,
    messageContent,
    recipientId,
    referenceId = ''
}) => {
    if (!isSmsEnabled()) {
        logAtLevel('log', 'SMS is disabled. Skipping SMS send.');
        return { sent: false, skipped: true, reason: 'disabled' };
    }

    const finalPhoneNumber = toE164PhoneNumber(phoneNumber);
    const truncatedMessage = truncateToSingleSegment(messageContent);

    if (!finalPhoneNumber) {
        const errorMessage = 'Recipient phone number is missing or invalid. Use E.164 format (e.g. +639XXXXXXXXX).';
        await saveSmsLog({
            phoneNumber: normalizePhoneNumber(phoneNumber),
            messageType,
            messageContent: truncatedMessage,
            recipientId,
            referenceId,
            status: 'failed',
            providerStatus: 'invalid_recipient',
            providerError: errorMessage
        });
        logAtLevel('warn', `[SMS] Invalid phone number for ${messageType}. Expected E.164, got: "${phoneNumber || ''}"`);
        return { sent: false, skipped: true, reason: 'invalid_recipient' };
    }

    const twilioConfig = getTwilioConfig();
    if (!twilioConfig.isConfigured) {
        const errorMessage = 'Twilio credentials are missing or incomplete';
        await saveSmsLog({
            phoneNumber: finalPhoneNumber,
            messageType,
            messageContent: truncatedMessage,
            recipientId,
            referenceId,
            status: 'failed',
            providerStatus: 'missing_config',
            providerError: errorMessage
        });
        logAtLevel('warn', '[SMS] Twilio credentials are missing or incomplete. SMS send skipped.');
        return { sent: false, skipped: true, reason: 'missing_config' };
    }

    try {
        const client = getTwilioClient();
        const result = await client.messages.create({
            body: truncatedMessage,
            from: twilioConfig.fromNumber,
            to: finalPhoneNumber
        });

        await saveSmsLog({
            phoneNumber: finalPhoneNumber,
            messageType,
            messageContent: truncatedMessage,
            recipientId,
            referenceId,
            status: 'sent',
            providerMessageId: result?.sid || '',
            providerStatus: result?.status || 'queued'
        });

        const sidText = result?.sid ? ' (SID: ' + result.sid + ')' : '';
        logAtLevel('log', `[SMS] ${messageType} sent to ${finalPhoneNumber}${sidText}`);
        return {
            sent: true,
            messageSid: result?.sid || '',
            providerStatus: result?.status || 'queued',
            messageContent: truncatedMessage
        };
    } catch (error) {
        await saveSmsLog({
            phoneNumber: finalPhoneNumber,
            messageType,
            messageContent: truncatedMessage,
            recipientId,
            referenceId,
            status: 'failed',
            providerStatus: error?.status ? String(error.status) : 'error',
            providerError: error?.message ? error.message : 'Unknown Twilio error',
            providerErrorCode: error?.code === undefined || error?.code === null ? '' : String(error.code)
        });

        logAtLevel('error', `Error sending ${messageType} SMS:`, error);
        return { sent: false, error };
    }
};

const sendDocumentStatusSMS = async (phoneNumber, name, documentType, status, referenceNumber) => {
    const docTypeFormatted = formatLabel(documentType);

    let messageContent = '';
    if (status === 'approved') {
        const referenceText = referenceNumber ? ' Ref: ' + referenceNumber : '';
        messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request is APPROVED. Please check your email for full details.${referenceText}`;
    } else if (status === 'processing') {
        messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request is PROCESSING. Please check your email for full details.`;
    } else if (status === 'ready_for_pickup') {
        messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} is READY FOR PICKUP. Please check your email for full details.`;
    } else if (status === 'rejected') {
        messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request was REJECTED. Please check your email for full details.`;
    } else if (status === 'completed') {
        messageContent = `Brgy Connect: Hi ${name}, your ${docTypeFormatted} request is COMPLETED. Please check your email for full details.`;
    } else {
        return { sent: false, skipped: true, reason: 'unsupported_status' };
    }

    return sendSmsNotification({
        phoneNumber,
        messageType: 'document_status',
        messageContent,
        referenceId: referenceNumber
    });
};

const sendStatusUpdateSMS = async (phoneNumber, name, status) => {
    let messageContent = '';

    if (status === 'approved') {
        messageContent = `Brgy Connect: Hi ${name}, your account is APPROVED. Please check your email for full details.`;
    } else if (status === 'rejected') {
        messageContent = `Brgy Connect: Hi ${name}, your account is REJECTED. Please check your email for full details.`;
    } else {
        return { sent: false, skipped: true, reason: 'unsupported_status' };
    }

    return sendSmsNotification({
        phoneNumber,
        messageType: 'resident_approval',
        messageContent
    });
};

const sendAppointmentSMS = async (phoneNumber, name, appointmentDate, appointmentTime, purpose) => {
    const messageContent = `Brgy Connect: Hi ${name}, your Appointment request on ${appointmentDate} ${appointmentTime} is ${purpose || 'scheduled'}. Please check your email for full details. Ref: Appointment`;

    return sendSmsNotification({
        phoneNumber,
        messageType: 'appointment_confirmation',
        messageContent
    });
};

module.exports = {
    sendSmsNotification,
    sendDocumentStatusSMS,
    sendStatusUpdateSMS,
    sendAppointmentSMS,
    formatLabel,
    truncateToSingleSegment,
    configureSmsRuntime,
    resetSmsRuntime
};
