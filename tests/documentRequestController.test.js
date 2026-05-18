const test = require('node:test');
const assert = require('node:assert/strict');

const DocumentRequest = require('../models/DocumentRequest');
const Resident = require('../models/Resident');
const documentRequestController = require('../controllers/documentRequestController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    documentRequestCreate: DocumentRequest.create,
    documentRequestFind: DocumentRequest.find,
    documentRequestFindOne: DocumentRequest.findOne,
    documentRequestFindById: DocumentRequest.findById,
    documentRequestFindByIdAndUpdate: DocumentRequest.findByIdAndUpdate,
    residentFindOne: Resident.findOne
};

test.afterEach(() => {
    DocumentRequest.create = originals.documentRequestCreate;
    DocumentRequest.find = originals.documentRequestFind;
    DocumentRequest.findOne = originals.documentRequestFindOne;
    DocumentRequest.findById = originals.documentRequestFindById;
    DocumentRequest.findByIdAndUpdate = originals.documentRequestFindByIdAndUpdate;
    Resident.findOne = originals.residentFindOne;
});

test('createDocumentRequest rejects missing required fields', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            documentType: 'barangay_clearance'
        }
    };
    const res = createMockResponse();

    await documentRequestController.createDocumentRequest(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'documentType and purpose are required'
    });
});

test('createPublicDocumentRequest rejects incomplete guest submissions', async () => {
    const req = {
        body: {
            documentType: 'barangay_clearance',
            purpose: 'Employment requirements'
        }
    };
    const res = createMockResponse();

    await documentRequestController.createPublicDocumentRequest(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'documentType, purpose, firstName, lastName, email, and address are required'
    });
});

test('createDocumentRequest requires a resident profile', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            documentType: 'barangay_clearance',
            purpose: 'Job application'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;

    await documentRequestController.createDocumentRequest(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('createDocumentRequest creates and returns a populated request', async () => {
    const populatedRequest = {
        _id: 'request-1',
        residentId: {
            _id: 'resident-1',
            firstName: 'Juan',
            lastName: 'Dela Cruz'
        },
        documentType: 'barangay_clearance',
        purpose: 'Job application',
        status: 'pending'
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            documentType: 'barangay_clearance',
            purpose: 'Job application',
            requestDetails: 'Needed for employer requirements'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    DocumentRequest.create = async (payload) => ({ _id: 'request-1', ...payload });
    DocumentRequest.findById = () => ({
        populate() {
            return Promise.resolve(populatedRequest);
        }
    });

    await documentRequestController.createDocumentRequest(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, populatedRequest);
});

test('createPublicDocumentRequest creates and returns a populated request', async () => {
    const populatedRequest = {
        _id: 'request-public-1',
        residentId: null,
        requesterType: 'non_resident',
        firstName: 'Maria',
        lastName: 'Santos',
        email: 'maria@gmail.com',
        address: 'City Proper',
        documentType: 'barangay_clearance',
        purpose: 'Employment requirements',
        status: 'pending'
    };

    const req = {
        body: {
            documentType: 'barangay_clearance',
            purpose: 'Employment requirements',
            requestDetails: 'For a job application',
            firstName: 'Maria',
            middleName: '',
            lastName: 'Santos',
            suffix: '',
            contactNumber: '09171234567',
            email: 'maria@gmail.com',
            address: 'City Proper'
        }
    };
    const res = createMockResponse();

    let capturedPayload;
    DocumentRequest.findOne = async () => null;
    DocumentRequest.create = async (payload) => {
        capturedPayload = payload;
        return { _id: 'request-public-1', ...payload };
    };
    DocumentRequest.findById = () => ({
        populate() {
            return Promise.resolve(populatedRequest);
        }
    });

    await documentRequestController.createPublicDocumentRequest(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(capturedPayload, {
        requesterType: 'non_resident',
        residentId: null,
        firstName: 'Maria',
        middleName: '',
        lastName: 'Santos',
        suffix: '',
        contactNumber: '09171234567',
        email: 'maria@gmail.com',
        address: 'City Proper',
        documentType: 'barangay_clearance',
        purpose: 'Employment requirements',
        requestDetails: 'For a job application'
    });
    assert.deepEqual(res.body, populatedRequest);
});

test('getMyDocumentRequests returns 404 when resident profile does not exist', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;

    await documentRequestController.getMyDocumentRequests(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('getDocumentRequestById blocks residents from viewing other residents requests', async () => {
    const request = {
        _id: 'request-1',
        residentId: {
            _id: { toString: () => 'resident-2' }
        }
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        params: { id: 'request-1' }
    };
    const res = createMockResponse();

    DocumentRequest.findById = () => ({
        populate() {
            return Promise.resolve(request);
        }
    });
    Resident.findOne = async () => ({
        _id: { toString: () => 'resident-1' },
        userId: 'user-1'
    });

    await documentRequestController.getDocumentRequestById(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Access denied'
    });
});

test('getDocumentRequestById blocks residents from viewing public requests', async () => {
    const request = {
        _id: 'request-public-1',
        residentId: null
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        params: { id: 'request-public-1' }
    };
    const res = createMockResponse();

    DocumentRequest.findById = () => ({
        populate() {
            return Promise.resolve(request);
        }
    });
    Resident.findOne = async () => ({
        _id: { toString: () => 'resident-1' },
        userId: 'user-1'
    });

    await documentRequestController.getDocumentRequestById(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Access denied'
    });
});

test('updateDocumentRequestStatus requires a status value', async () => {
    const req = {
        params: { id: 'request-1' },
        body: {
            adminNotes: 'Ready tomorrow'
        }
    };
    const res = createMockResponse();

    await documentRequestController.updateDocumentRequestStatus(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'status is required'
    });
});

test('updateDocumentRequestStatus returns 404 when request does not exist', async () => {
    const req = {
        params: { id: 'request-404' },
        body: {
            status: 'approved'
        }
    };
    const res = createMockResponse();

    DocumentRequest.findById = async () => null;

    await documentRequestController.updateDocumentRequestStatus(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Document request not found'
    });
});

test('getDocumentRequestById returns 400 for malformed ids', async () => {
    const req = {
        user: { id: 'user-1', role: 'admin' },
        params: { id: 'bad-id' }
    };
    const res = createMockResponse();

    await documentRequestController.getDocumentRequestById(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid ID format'
    });
});
