const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const uploadPaths = require('../utils/uploadPaths');

test('public upload directory resolves to the repository uploads/public folder', () => {
    assert.equal(
        uploadPaths.publicUploadDirectory,
        path.resolve(__dirname, '../uploads/public')
    );
});
