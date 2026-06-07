const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const app = require('../app');
const User = require('../models/User');
const Resident = require('../models/Resident');
const s3 = require('../utils/s3');

const originalUserFindById = User.findById;
const originalResidentFindById = Resident.findById;
const originalS3IsConfigured = s3.isConfigured;
const originalS3GetObject = s3.getObject;

const secret = 'resident-route-test-secret';

const startServer = () => {
    const server = app.listen(0);
    const { port } = server.address();

    return {
        baseUrl: `http://127.0.0.1:${port}`,
        close: () => new Promise((resolve) => server.close(resolve))
    };
};

const tokenFor = (id, role) => jwt.sign({ id, role }, secret);

const stubUserRole = (role) => {
    process.env.JWT_SECRET = secret;
    User.findById = () => ({
        select: async () => ({
            _id: `${role}-user`,
            role,
            isActive: true
        })
    });
};

test.afterEach(() => {
    User.findById = originalUserFindById;
    Resident.findById = originalResidentFindById;
    s3.isConfigured = originalS3IsConfigured;
    s3.getObject = originalS3GetObject;
});

test('resident detail by id rejects authenticated residents', async () => {
    stubUserRole('resident');

    const server = startServer();

    try {
        const response = await fetch(`${server.baseUrl}/api/residents/resident-1`, {
            headers: {
                Authorization: `Bearer ${tokenFor('resident-user', 'resident')}`
            }
        });

        assert.equal(response.status, 403);
    } finally {
        await server.close();
    }
});

test('resident detail by id allows admins', async () => {
    stubUserRole('admin');

    const expectedResident = {
        _id: 'resident-1',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        address: 'Purok 1',
        profileImage: 'profileImage-route-test.png'
    };

    Resident.findById = () => ({
        populate: async () => expectedResident
    });

    const server = startServer();

    try {
        const response = await fetch(`${server.baseUrl}/api/residents/resident-1`, {
            headers: {
                Authorization: `Bearer ${tokenFor('admin-user', 'admin')}`
            }
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.deepEqual(body, {
            ...expectedResident,
            profileImage: '/uploads/profileImage-route-test.png'
        });
    } finally {
        await server.close();
    }
});

test('resident proof download rejects authenticated residents', async () => {
    stubUserRole('resident');

    const server = startServer();

    try {
        const response = await fetch(`${server.baseUrl}/api/residents/resident-1/proof`, {
            headers: {
                Authorization: `Bearer ${tokenFor('resident-user', 'resident')}`
            }
        });

        assert.equal(response.status, 403);
    } finally {
        await server.close();
    }
});

test('resident proof download allows admins when the private file exists', async () => {
    stubUserRole('admin');

    const proofDirectory = path.join(__dirname, '../private/uploads/proofs');
    const proofFilename = 'proofOfResidency-route-test.txt';
    const proofPath = path.join(proofDirectory, proofFilename);

    fs.mkdirSync(proofDirectory, { recursive: true });
    fs.writeFileSync(proofPath, 'private proof test');

    Resident.findById = () => ({
        select: async () => ({
            _id: 'resident-1',
            proofOfResidency: proofFilename
        })
    });

    const server = startServer();

    try {
        const response = await fetch(`${server.baseUrl}/api/residents/resident-1/proof`, {
            headers: {
                Authorization: `Bearer ${tokenFor('admin-user', 'admin')}`
            }
        });
        const body = await response.text();

        assert.equal(response.status, 200);
        assert.equal(body, 'private proof test');
    } finally {
        await server.close();
        fs.rmSync(proofPath, { force: true });
    }
});

test('resident proof download streams S3-backed proofs for admins', async () => {
    stubUserRole('admin');

    Resident.findById = () => ({
        select: async () => ({
            _id: 'resident-1',
            proofOfResidency: 'proofs/proofOfResidency-route-test.txt'
        })
    });
    s3.isConfigured = () => true;
    s3.getObject = async (key) => {
        assert.equal(key, 'proofs/proofOfResidency-route-test.txt');
        return {
            Body: Readable.from(['s3 proof test']),
            ContentType: 'text/plain',
            ContentLength: 13
        };
    };

    const server = startServer();

    try {
        const response = await fetch(`${server.baseUrl}/api/residents/resident-1/proof`, {
            headers: {
                Authorization: `Bearer ${tokenFor('admin-user', 'admin')}`
            }
        });
        const body = await response.text();

        assert.equal(response.status, 200);
        assert.equal(response.headers.get('content-type'), 'text/plain');
        assert.equal(body, 's3 proof test');
    } finally {
        await server.close();
    }
});
