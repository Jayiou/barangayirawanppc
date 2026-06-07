const test = require('node:test');
const assert = require('node:assert/strict');
const mailer = require('../utils/mailer');

test('sendCustomResidentEmail logs a mock email send when EMAIL_MOCK is enabled', async () => {
    const originalEnv = process.env.EMAIL_MOCK;
    const originalLog = console.log;
    const logs = [];

    process.env.EMAIL_MOCK = 'true';
    console.log = (...args) => logs.push(args);

    try {
        await mailer.sendCustomResidentEmail(
            'resident@example.com',
            'Juan',
            'Mock Email Test',
            'This is a mock notification email.'
        );

        assert.ok(logs.some(args => args[0] && String(args[0]).includes('Mock send')),
            'Expected a mock email log message');
    } finally {
        process.env.EMAIL_MOCK = originalEnv;
        console.log = originalLog;
    }
});
