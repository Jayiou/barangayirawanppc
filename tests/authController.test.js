const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../models/User');
const Resident = require('../models/Resident');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const mailer = require('../utils/mailer');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    findOne: User.findOne,
    create: User.create,
    exists: User.exists,
    residentCreate: Resident.create,
    residentFindOne: Resident.findOne,
    findById: User.findById,
    findByIdAndDelete: User.findByIdAndDelete,
    hash: bcrypt.hash,
    compare: bcrypt.compare,
    sign: jwt.sign,
    sendOtpEmail: mailer.sendOtpEmail,
    sendPasswordResetEmail: mailer.sendPasswordResetEmail,
    nodeEnv: process.env.NODE_ENV,
    skipRecaptcha: process.env.SKIP_RECAPTCHA
};

test.afterEach(() => {
    User.findOne = originals.findOne;
    User.create = originals.create;
    User.exists = originals.exists;
    User.findById = originals.findById;
    User.findByIdAndDelete = originals.findByIdAndDelete;
    Resident.create = originals.residentCreate;
    Resident.findOne = originals.residentFindOne;
    bcrypt.hash = originals.hash;
    bcrypt.compare = originals.compare;
    jwt.sign = originals.sign;
    mailer.sendOtpEmail = originals.sendOtpEmail;
    mailer.sendPasswordResetEmail = originals.sendPasswordResetEmail;
    process.env.NODE_ENV = originals.nodeEnv;
    process.env.SKIP_RECAPTCHA = originals.skipRecaptcha;
});

const defaultValidBody = {
    username: 'juan',
    email: 'juan@example.com',
    password: 'Secret_123',
    firstName: 'Juan',
    middleName: 'Santos',
    lastName: 'Dela Cruz',
    sex: 'male',
    birthDate: '1990-01-01',
    contactNumber: '09123456789',
    address: 'Barangay Irawan',
    purok: 'Sampalok',
    zone: 'Zone 1'
};

const defaultValidReq = {
    body: { ...defaultValidBody },
    file: { filename: 'proof.jpg' }
};

test('register caches the resident profile and returns an OTP payload', async () => {
    process.env.SKIP_RECAPTCHA = 'true';
    const req = { ...defaultValidReq };
    const res = createMockResponse();
    let createdUserPayload;

    User.findOne = async () => null;
    User.exists = async () => true;
    bcrypt.hash = async (value) => `hashed-${value}`;
    User.create = async (payload) => {
        createdUserPayload = payload;
        return {
            _id: 'user-123',
            ...payload,
            isActive: false
        };
    };
    let residentCreateCalled = false;
    Resident.create = async () => {
        residentCreateCalled = true;
        return { _id: 'resident-123' };
    };
    mailer.sendOtpEmail = async () => true;

    await authController.register(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.message, 'Registration initiated. Please check your email for the OTP. If you do not see it in your inbox, please check your Spam folder.');
    assert.equal(res.body.user.email, 'juan@example.com');
    assert.match(createdUserPayload.otpCode, /^hashed-\d{6}$/);
    assert.equal(createdUserPayload.pendingResidentProfile.middleName, 'Santos');
    assert.equal(createdUserPayload.pendingResidentProfile.contactNumber, '09123456789');
    assert.equal(createdUserPayload.pendingResidentProfile.address, 'Barangay Irawan');
    assert.equal(createdUserPayload.pendingResidentProfile.purok, 'Sampalok');
    assert.equal(createdUserPayload.pendingResidentProfile.zone, 'Zone 1');
    assert.equal(createdUserPayload.pendingResidentProfile.proofOfResidency, 'proof.jpg');
    assert.equal(residentCreateCalled, false);
});

test('verifyOtp creates the resident profile after OTP verification', async () => {
    const req = {
        body: {
            email: 'juan@example.com',
            otpCode: '123456'
        }
    };
    const res = createMockResponse();
    let savedUser;
    let createdResidentPayload;

    User.findOne = async () => ({
        _id: 'user-123',
        email: 'juan@example.com',
        accountStatus: 'pending_otp',
        otpExpires: new Date(Date.now() + 60_000),
        otpCode: '123456',
        pendingResidentProfile: {
            firstName: 'Juan',
            middleName: 'Santos',
            lastName: 'Dela Cruz',
            sex: 'male',
            birthDate: '1990-01-01',
            contactNumber: '09123456789',
            address: 'Barangay Irawan',
            purok: 'Sampalok',
            zone: 'Zone 1',
            proofOfResidency: 'proof.jpg'
        },
        async save() {
            savedUser = this;
        }
    });
    Resident.findOne = async () => null;
    Resident.create = async (payload) => {
        createdResidentPayload = payload;
        return { _id: 'resident-123' };
    };
    bcrypt.compare = async () => true;

    await authController.verifyOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Email successfully verified! Your account is now pending admin approval.');
    assert.equal(createdResidentPayload.userId, 'user-123');
    assert.equal(createdResidentPayload.firstName, 'Juan');
    assert.equal(createdResidentPayload.middleName, 'Santos');
    assert.equal(createdResidentPayload.purok, 'Sampalok');
    assert.equal(createdResidentPayload.zone, 'Zone 1');
    assert.equal(savedUser.accountStatus, 'pending_approval');
    assert.equal(savedUser.pendingResidentProfile, undefined);
});

test('register requires reCaptcha in production', async () => {
    process.env.SKIP_RECAPTCHA = 'false';
    const req = { ...defaultValidReq };
    const res = createMockResponse();

    process.env.NODE_ENV = 'production';

    await authController.register(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'reCaptcha verification is required.'
    });
});

test('register rejects invalid email addresses', async () => {
    process.env.SKIP_RECAPTCHA = 'true';
    const req = { ...defaultValidReq, body: { ...defaultValidBody, email: 'juan-at-example.com' } };
    const res = createMockResponse();

    await authController.register(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid email address.'
    });
});

test('register rejects passwords that are too short', async () => {
    process.env.SKIP_RECAPTCHA = 'true';
    const req = { ...defaultValidReq, body: { ...defaultValidBody, password: 'short' } };
    const res = createMockResponse();

    await authController.register(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Password must be at least 8 characters long.'
    });
});

test('register allows the first admin account only when requested', async () => {
    process.env.SKIP_RECAPTCHA = 'true';
    const req = { ...defaultValidReq, body: { ...defaultValidBody, username: 'captain', email: 'captain@example.com', role: 'admin' } };
    const res = createMockResponse();

    User.findOne = async () => null;
    User.exists = async () => false; // no admin exists
    bcrypt.hash = async (value) => `hashed-${value}`;
    
    let savedRole = '';
    User.create = async (payload) => {
        savedRole = payload.role;
        return { _id: 'user-999', ...payload, isActive: false };
    };
    Resident.create = async () => ({ _id: 'resident-999' });
    mailer.sendOtpEmail = async () => true;

    await authController.register(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(savedRole, 'admin');
});

test('login rejects inactive users before password comparison', async () => {
    const req = {
        body: {
            username: 'juan',
            password: 'secret123'
        }
    };
    const res = createMockResponse();

    User.findOne = async () => ({
        _id: 'user-123',
        username: 'juan',
        password: 'hashed-password',
        role: 'resident',
        email: 'juan@example.com',
        accountStatus: 'approved',
        isActive: false
    });
    bcrypt.compare = async () => true;

    await authController.login(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Login unavailable. Please check your email or contact the barangay office.'
    });
});

test('login returns a standardized auth error for invalid passwords', async () => {
    const req = {
        body: {
            username: 'juan',
            password: 'wrongpass'
        }
    };
    const res = createMockResponse();

    User.findOne = async () => ({
        _id: 'user-123',
        username: 'juan',
        password: 'hashed-password',
        role: 'resident',
        email: 'juan@example.com',
        accountStatus: 'approved',
        isActive: true,
        async save() {
            this.saved = true;
        }
    });
    bcrypt.compare = async () => false;

    await authController.login(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid username or password'
    });
});

test('changePassword updates the resident password when current password matches', async () => {
    const req = {
        user: { id: 'user-123' },
        body: {
            currentPassword: 'Old_12345',
            newPassword: 'New_12345',
            confirmPassword: 'New_12345'
        }
    };
    const res = createMockResponse();
    let savedUser;

    User.findById = async () => ({
        _id: 'user-123',
        password: 'hashed-old',
        async save() {
            savedUser = this;
        }
    });
    bcrypt.compare = async (value, hash) => value === 'Old_12345' && hash === 'hashed-old';
    bcrypt.hash = async (value) => `hashed-${value}`;

    await authController.changePassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Password updated successfully.');
    assert.equal(savedUser.password, 'hashed-New_12345');
    assert.equal(savedUser.failedLoginAttempts, 0);
});

test('changePassword rejects an incorrect current password', async () => {
    const req = {
        user: { id: 'user-123' },
        body: {
            currentPassword: 'Wrong_12345',
            newPassword: 'New_12345',
            confirmPassword: 'New_12345'
        }
    };
    const res = createMockResponse();

    User.findById = async () => ({
        _id: 'user-123',
        password: 'hashed-old',
        async save() {}
    });
    bcrypt.compare = async () => false;

    await authController.changePassword(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Current password is incorrect.'
    });
});

test('login returns a standardized auth error when the user does not exist', async () => {
    const req = {
        body: {
            username: 'missing',
            password: 'Secret_123'
        }
    };
    const res = createMockResponse();

    User.findOne = async () => null;

    await authController.login(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid username or password'
    });
});

test('forgotPassword sends a reset link when the email exists', async () => {
    const req = {
        body: {
            email: 'juan@example.com',
            appUrl: 'http://192.168.1.2:5000'
        },
        headers: {
            origin: 'http://localhost:5173'
        },
        protocol: 'http',
        get: () => 'localhost:5000'
    };
    const res = createMockResponse();
    const savedUser = {
        _id: 'user-123',
        username: 'juan',
        email: 'juan@example.com',
        passwordResetToken: '',
        passwordResetExpires: null,
        async save() {
            this.saved = true;
        }
    };

    User.findOne = async () => savedUser;
    mailer.sendPasswordResetEmail = async (toEmail, name, resetLink) => {
        assert.equal(toEmail, 'juan@example.com');
        assert.equal(name, 'juan');
        assert.match(resetLink, /^http:\/\/192\.168\.1\.2:5000\/\?resetToken=/);
    };

    await authController.forgotPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'If the request is valid, a password reset link has been sent.');
    assert.ok(savedUser.passwordResetToken);
    assert.ok(savedUser.passwordResetExpires instanceof Date);
});

test('resetPassword updates the password and clears reset state', async () => {
    const req = {
        body: {
            email: 'juan@example.com',
            resetToken: 'reset-token-123',
            password: 'NewPass_123',
            confirmPassword: 'NewPass_123'
        }
    };
    const res = createMockResponse();
    const hashedResetToken = require('node:crypto').createHash('sha256').update('reset-token-123').digest('hex');
    const user = {
        password: 'old-hash',
        passwordResetToken: hashedResetToken,
        passwordResetExpires: new Date(Date.now() + 60 * 1000),
        failedLoginAttempts: 4,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
        async save() {
            this.saved = true;
        }
    };

    User.findOne = async (query) => {
        assert.equal(query.email, 'juan@example.com');
        assert.equal(query.passwordResetToken, hashedResetToken);
        return user;
    };
    bcrypt.hash = async (value) => `hashed-${value}`;

    await authController.resetPassword(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(user.password, 'hashed-NewPass_123');
    assert.equal(user.passwordResetToken, undefined);
    assert.equal(user.passwordResetExpires, undefined);
    assert.equal(user.failedLoginAttempts, 0);
    assert.equal(user.lockedUntil, null);
    assert.equal(user.saved, true);
});

test('verifyOtp compares hashed OTP values and clears them after success', async () => {
    const req = {
        body: {
            email: 'JUAN@example.com',
            otpCode: '123456'
        }
    };
    const res = createMockResponse();
    const user = {
        accountStatus: 'pending_otp',
        otpCode: '$2b$test-hashed-otp',
        otpExpires: new Date(Date.now() + 60 * 1000),
        async save() {
            this.saved = true;
        }
    };

    User.findOne = async (query) => {
        assert.equal(query.email, 'juan@example.com');
        return user;
    };
    Resident.findOne = async () => null;
    bcrypt.compare = async (value, hash) => value === '123456' && hash === '$2b$test-hashed-otp';

    await authController.verifyOtp(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(user.accountStatus, 'pending_approval');
    assert.equal(user.otpCode, undefined);
    assert.equal(user.otpExpires, undefined);
    assert.equal(user.saved, true);
});

test('getMe returns the current user without the password field', async () => {
    const expectedUser = {
        _id: 'user-123',
        username: 'juan',
        email: 'juan@example.com',
        role: 'resident'
    };

    const req = { user: { id: 'user-123' } };
    const res = createMockResponse();

    User.findById = () => ({
        select: async () => expectedUser
    });

    await authController.getMe(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, expectedUser);
});
