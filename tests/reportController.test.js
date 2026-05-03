const test = require('node:test');
const assert = require('node:assert/strict');

const Report = require('../models/Report');
const Resident = require('../models/Resident');
const reportController = require('../controllers/reportController');
const { createMockResponse } = require('./helpers/httpMocks');

const originals = {
    reportCreate: Report.create,
    reportFind: Report.find,
    reportFindById: Report.findById,
    reportFindByIdAndUpdate: Report.findByIdAndUpdate,
    residentFindOne: Resident.findOne
};

test.afterEach(() => {
    Report.create = originals.reportCreate;
    Report.find = originals.reportFind;
    Report.findById = originals.reportFindById;
    Report.findByIdAndUpdate = originals.reportFindByIdAndUpdate;
    Resident.findOne = originals.residentFindOne;
});

test('createReport rejects missing required fields', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            reportType: 'noise_complaint',
            description: 'May videoke hanggang madaling araw'
        }
    };
    const res = createMockResponse();

    await reportController.createReport(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'reportType, title, description, and locationText are required'
    });
});

test('createReport rejects invalid incident dates', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            reportType: 'disturbance',
            title: 'May gulo sa kanto',
            description: 'May sigawan at suntukan',
            locationText: 'Purok 2, tapat ng tindahan',
            incidentDate: 'not-a-date'
        }
    };
    const res = createMockResponse();

    await reportController.createReport(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Please provide a valid incidentDate'
    });
});

test('createReport requires a resident profile', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            reportType: 'noise_complaint',
            title: 'Maingay na kapitbahay',
            description: 'May malakas na speaker',
            locationText: 'Purok 1'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;

    await reportController.createReport(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('createReport creates and returns a populated report', async () => {
    const populatedReport = {
        _id: 'report-1',
        residentId: {
            _id: 'resident-1',
            firstName: 'Juan',
            lastName: 'Dela Cruz'
        },
        reportType: 'sanitation',
        title: 'May patambak na basura',
        description: 'Hindi nakukuha ang basura sa gilid ng kalsada',
        locationText: 'Purok 3',
        status: 'pending'
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        body: {
            reportType: 'sanitation',
            title: 'May patambak na basura',
            description: 'Hindi nakukuha ang basura sa gilid ng kalsada',
            locationText: 'Purok 3',
            priority: 'high'
        }
    };
    const res = createMockResponse();

    Resident.findOne = async () => ({ _id: 'resident-1', userId: 'user-1' });
    Report.create = async (payload) => ({ _id: 'report-1', ...payload });
    Report.findById = () => ({
        populate() {
            return Promise.resolve(populatedReport);
        }
    });

    await reportController.createReport(req, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, populatedReport);
});

test('getMyReports returns 404 when resident profile does not exist', async () => {
    const req = {
        user: { id: 'user-1', role: 'resident' }
    };
    const res = createMockResponse();

    Resident.findOne = async () => null;

    await reportController.getMyReports(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Resident profile not found. Please complete your profile first.'
    });
});

test('getReportById blocks residents from viewing other resident reports', async () => {
    const report = {
        _id: 'report-1',
        residentId: {
            _id: { toString: () => 'resident-2' }
        }
    };

    const req = {
        user: { id: 'user-1', role: 'resident' },
        params: { id: 'report-1' }
    };
    const res = createMockResponse();

    Report.findById = () => ({
        populate() {
            return Promise.resolve(report);
        }
    });
    Resident.findOne = async () => ({
        _id: { toString: () => 'resident-1' },
        userId: 'user-1'
    });

    await reportController.getReportById(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Access denied'
    });
});

test('updateReportStatus requires a status value', async () => {
    const req = {
        params: { id: 'report-1' },
        body: {
            adminNotes: 'Tatawagan ang complainant'
        }
    };
    const res = createMockResponse();

    await reportController.updateReportStatus(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'status is required'
    });
});

test('updateReportStatus returns 404 when report does not exist', async () => {
    const req = {
        params: { id: 'report-404' },
        body: {
            status: 'reviewing'
        }
    };
    const res = createMockResponse();

    Report.findByIdAndUpdate = async () => null;

    await reportController.updateReportStatus(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Report not found'
    });
});

test('getReportById returns 400 for malformed ids', async () => {
    const req = {
        user: { id: 'user-1', role: 'admin' },
        params: { id: 'bad-id' }
    };
    const res = createMockResponse();

    await reportController.getReportById(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
        success: false,
        message: 'Invalid ID format'
    });
});
