const path = require('path');
const fs = require('fs').promises;
const { getBrowser, closeBrowser } = require('../utils/documentGenerator');

const TEMPLATE_DIR = path.join(__dirname, '..', 'Certification new');
const UPLOADS_DIR = process.env.PUBLIC_UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'public');

const renderTemplate = async (templateName, data) => {
  const filePath = path.join(TEMPLATE_DIR, templateName);
  let html = await fs.readFile(filePath, 'utf8');
  Object.keys(data || {}).forEach((key) => {
    const re = new RegExp('{{\s*' + key + '\s*}}', 'g');
    html = html.replace(re, data[key] || '');
  });
  html = html.replace(/{{\s*[^}]+\s*}}/g, '');
  return html;
};

(async () => {
  try {
    const template = process.argv[2] || 'barangay_certificate.html';
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

    const html = await renderTemplate(template, data);

    // ensure uploads dir exists
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    const filename = `sample-${Date.now()}.pdf`;
    const outPath = path.join(UPLOADS_DIR, filename);
    await fs.writeFile(outPath, pdfBuffer);
    console.log('PDF written to:', outPath);

    await page.close();
    await closeBrowser();
  } catch (err) {
    console.error('Error generating sample PDF:', err);
    try { await closeBrowser(); } catch(e){}
    process.exit(1);
  }
})();
