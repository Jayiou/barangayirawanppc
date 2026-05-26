const test = require('node:test');
const assert = require('node:assert/strict');

const sms = require('../utils/sms');

class FakeSmsLog {
    static records = [];

    constructor(payload) {
        this.payload = payload;
    }

    async save() {
        FakeSmsLog.records.push(this.payload);
        return this;
    }

    static reset() {
        FakeSmsLog.records = [];
    }
}

const logger = {
    logMessages: [],
    warnMessages: [],
    errorMessages: [],
    log(...args) {
        this.logMessages.push(args);
    },
    warn(...args) {
        this.warnMessages.push(args);
    },
    error(...args) {
        this.errorMessages.push(args);
    }
};

const restoreSmsRuntime = () => {
    sms.resetSmsRuntime();
    FakeSmsLog.reset();
    logger.logMessages = [];
    logger.warnMessages = [];
    logger.errorMessages = [];
};

test.afterEach(restoreSmsRuntime);

test('sendDocumentStatusSMS sends a compact SMS through Twilio and records success', async () => {
    const createCalls = [];
    const fakeClient = {
        messages: {
            create: async (payload) => {
                createCalls.push(payload);
                return { sid: 'SM123', status: 'queued' };
            }
        }
    };

    sms.configureSmsRuntime({
        env: {
            SMS_ENABLED: 'true',
            TWILIO_ACCOUNT_SID: 'AC123',
            TWILIO_AUTH_TOKEN: 'token',
            TWILIO_NUMBER: '+15550001111'
        },
        smsLogModel: FakeSmsLog,
        twilioClientFactory: () => fakeClient,
        logger
    });

    const result = await sms.sendDocumentStatusSMS(
        '+15550002222',
        'Prince',
        'barangay_clearance',
        'approved',
        'DOC-123'
    );

    assert.equal(result.sent, true);
    assert.equal(result.messageSid, 'SM123');
    assert.equal(createCalls.length, 1);
    assert.deepEqual(createCalls[0], {
        body: 'Brgy Connect: Hi Prince, your Barangay Clearance request is APPROVED. Please check your email for full details. Ref: DOC-123',
        from: '+15550001111',
        to: '+15550002222'
    });
    assert.equal(FakeSmsLog.records.length, 1);
    assert.equal(FakeSmsLog.records[0].status, 'sent');
    assert.equal(FakeSmsLog.records[0].providerMessageId, 'SM123');
});

test('sendSmsNotification records a failed log when Twilio credentials are missing', async () => {
    sms.configureSmsRuntime({
        env: { SMS_ENABLED: 'true' },
        smsLogModel: FakeSmsLog,
        logger
    });

    const result = await sms.sendSmsNotification({
        phoneNumber: '+15550002222',
        messageType: 'resident_update',
        messageContent: 'Brgy Connect: Hi Prince, your account is APPROVED. Please check your email for full details.'
    });

    assert.equal(result.sent, false);
    assert.equal(result.skipped, true);
    assert.equal(result.reason, 'missing_config');
    assert.equal(FakeSmsLog.records.length, 1);
    assert.equal(FakeSmsLog.records[0].status, 'failed');
    assert.equal(FakeSmsLog.records[0].providerStatus, 'missing_config');
    assert.match(FakeSmsLog.records[0].providerError, /Twilio credentials are missing/i);
    assert.equal(logger.warnMessages.length > 0, true);
});

test('sendStatusUpdateSMS records a failed log when Twilio returns an error', async () => {
    const fakeClient = {
        messages: {
            create: async () => {
                const error = new Error('Twilio rejected the request');
                error.code = 21211;
                error.status = 400;
                throw error;
            }
        }
    };

    sms.configureSmsRuntime({
        env: {
            SMS_ENABLED: 'true',
            TWILIO_ACCOUNT_SID: 'AC123',
            TWILIO_AUTH_TOKEN: 'token',
            TWILIO_NUMBER: '+15550001111'
        },
        smsLogModel: FakeSmsLog,
        twilioClientFactory: () => fakeClient,
        logger
    });

    const result = await sms.sendStatusUpdateSMS('+15550002222', 'Prince', 'approved');

    assert.equal(result.sent, false);
    assert.equal(Boolean(result.error), true);
    assert.equal(FakeSmsLog.records.length, 1);
    assert.equal(FakeSmsLog.records[0].status, 'failed');
    assert.equal(FakeSmsLog.records[0].providerErrorCode, '21211');
    assert.equal(FakeSmsLog.records[0].providerStatus, '400');
});