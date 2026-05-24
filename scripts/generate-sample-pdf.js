const path = require('node:path');
const fs = require('node:fs').promises;
const { createDocumentPdfBuffer } = require('../utils/documentPdfGenerator');

const UPLOADS_DIR = process.env.PUBLIC_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'public');

(async () => {
  try {
    const documentType = process.argv[2] || 'certificate';
    const name = process.argv[3] || 'Juan Dela Cruz';

    const data = {
      FULL_NAME: name,
      DAY: '01',
      MONTH: 'January',
      PURPOSE: 'For Testing Purposes',
      BARANGAY: 'Irawan',
      CITY: 'Puerto Princesa City',
      PROVINCE: 'Palawan'
    };

    // ensure uploads dir exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const pdfBuffer = await createDocumentPdfBuffer({ type: documentType, data });

    const filename = `sample-${Date.now()}.pdf`;
    const outPath = path.join(UPLOADS_DIR, filename);
    await fs.writeFile(outPath, pdfBuffer);
    console.log('PDF written to:', outPath);
  } catch (err) {
    console.error('Error generating sample PDF:', err);
    process.exit(1);
  }
})();
