const path = require('path');
const fs = require('fs');
const { createDocumentPdfBuffer } = require('../utils/documentPdfGenerator');

(async () => {
  try {
    const data = {
      FULL_NAME: 'Prince Jay Lubrico Dela Peña',
      AGE: '22',
      DAY: '24',
      MONTH: 'May',
      PURPOSE: 'For whatever legal purpose it may serve',
      BARANGAY: 'Irawan',
      CITY: 'Puerto Princesa City',
      PROVINCE: 'Palawan'
    };

    const buf = await createDocumentPdfBuffer({ type: 'clearance', data });
    const out = path.join(__dirname, '..', 'uploads', 'public', 'clearance-test.pdf');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buf);
    console.log('Wrote:', out);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
