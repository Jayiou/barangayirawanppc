const path = require('node:path');
const fs = require('node:fs');
const PDFDocument = require('pdfkit');

const TEMPLATE_DIR = path.join(__dirname, '..', 'Certification new');
const LOGO_DIR = path.join(TEMPLATE_DIR, 'logos');
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT_MARGIN = 48;
const RIGHT_MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;

const TYPE_CONFIG = {
  certificate: {
    title: 'Barangay Certificate',
    bodyTitle: 'TO WHOM IT MAY CONCERN:',
    paragraphLines: [
      [
        [
          { type: 'text', value: 'This is to certify that ' },
          { type: 'field', key: 'FULL_NAME', width: 138 },
          { type: 'text', value: ', ' },
          { type: 'field', key: 'AGE', width: 34 },
          { type: 'text', value: ' years of age, Filipino, and a resident of' }
        ],
        [
          { type: 'text', value: 'Barangay ' },
          { type: 'field', key: 'BARANGAY', width: 108 },
          { type: 'text', value: ', Municipality/City of ' },
          { type: 'field', key: 'CITY', width: 138 },
          { type: 'text', value: ', Province of ' },
          { type: 'field', key: 'PROVINCE', width: 118 },
          { type: 'text', value: '.' }
        ]
      ],
      [
        [
          { type: 'text', value: 'This certificate is issued upon the request of the above-named person for ' },
          { type: 'field', key: 'PURPOSE', width: 176 },
          { type: 'text', value: ' and for all lawful intents and purposes.' }
        ]
      ],
      [
        [
          { type: 'text', value: 'Issued this ' },
          { type: 'field', key: 'DAY', width: 28 },
          { type: 'text', value: ' day of ' },
          { type: 'field', key: 'MONTH', width: 128 },
          { type: 'text', value: ', 2026 at Barangay Irawan, Puerto Princesa City, Palawan.' }
        ]
      ]
    ]
  },
  clearance: {
    title: 'Barangay Clearance',
    bodyTitle: 'TO WHOM IT MAY CONCERN:',
    paragraphLines: [
      [
        [
          { type: 'text', value: 'This is to certify that ' },
          { type: 'field', key: 'FULL_NAME', width: 138 },
          { type: 'text', value: ', Filipino, ' },
          { type: 'field', key: 'AGE', width: 34 },
          { type: 'text', value: ' years of age, and a resident of Barangay Irawan, Puerto Princesa City, Palawan,' }
        ],
        [
          { type: 'text', value: 'has been a bona fide resident of this barangay and is known to be of good moral character.' }
        ]
      ],
      [
        [
          { type: 'text', value: 'This is further to certify that the above-named person has no derogatory record or pending case filed in this barangay' }
        ],
        [
          { type: 'text', value: 'as of this date.' }
        ]
      ],
      [
        [
          { type: 'text', value: 'This certification is issued upon the request of the above-named person' }
        ],
        [
          { type: 'text', value: 'for whatever legal purpose it may serve.' }
        ]
      ],
      [
        [
          { type: 'text', value: 'Issued this ' },
          { type: 'field', key: 'DAY', width: 28 },
          { type: 'text', value: ' day of ' },
          { type: 'field', key: 'MONTH', width: 128 },
          { type: 'text', value: ' 2026, at Barangay Irawan, Puerto Princesa City, Palawan.' }
        ]
      ]
    ]
  },
  indigency: {
    title: 'Barangay Indigency',
    bodyTitle: 'TO WHOM IT MAY CONCERN:',
    paragraphLines: [
      [
        [
          { type: 'text', value: 'This is to certify that ' },
          { type: 'field', key: 'FULL_NAME', width: 138 },
          { type: 'text', value: ', ' },
          { type: 'field', key: 'AGE', width: 34 },
          { type: 'text', value: ' years of age, Filipino, and a resident of Barangay Irawan, Puerto Princesa City, Palawan,' }
        ],
        [
          { type: 'text', value: 'is one of the indigent residents of this barangay.' }
        ]
      ],
      [
        [
          { type: 'text', value: 'This certification is being issued upon the request of the above-named person for the purpose of ' },
          { type: 'field', key: 'PURPOSE', width: 180 },
          { type: 'text', value: '.' }
        ],
        [
          { type: 'text', value: '(e.g. scholarship application, medical assistance, requirements, etc.).' }
        ]
      ],
      [
        [
          { type: 'text', value: 'Issued this ' },
          { type: 'field', key: 'DAY', width: 28 },
          { type: 'text', value: ' day of ' },
          { type: 'field', key: 'MONTH', width: 128 },
          { type: 'text', value: ', 2026, at Barangay Irawan, Puerto Princesa City.' }
        ]
      ]
    ]
  }
};

const resolveTypeConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.certificate;

const createPdfBuffer = (drawPage) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    bufferPages: false,
    compress: true,
    autoFirstPage: false
  });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  try {
    drawPage(doc);
    doc.end();
  } catch (error) {
    reject(error);
  }
});

const ensureImagePath = (fileName) => path.join(LOGO_DIR, fileName);

const fitTextSize = (doc, text, maxWidth, startingSize, minimumSize = 8) => {
  const value = String(text ?? '');
  let size = startingSize;

  while (size > minimumSize && doc.fontSize(size).widthOfString(value) > maxWidth) {
    size -= 0.5;
  }

  return size;
};

const drawField = (doc, text, x, y, width, options = {}) => {
  const padding = options.padding ?? 4;
  const baseFontSize = options.fontSize ?? 16;
  const maxWidth = options.maxWidth ?? width;
  const fieldWidth = Math.max(width, Math.min(maxWidth, doc.fontSize(baseFontSize).widthOfString(String(text ?? '')) + padding * 2));
  const fontSize = fitTextSize(doc, text, fieldWidth - padding * 2, baseFontSize);
  const fieldText = String(text ?? '');
  const textY = y - 1;

  doc.save();
  doc.font('Helvetica-Bold').fontSize(fontSize).fillColor('#111827');
  doc.text(fieldText, x, textY, {
    width: fieldWidth,
    align: 'center',
    lineBreak: false
  });
  doc.moveTo(x, y + fontSize + 2).lineTo(x + fieldWidth, y + fontSize + 2).strokeColor('#111827').stroke();
  doc.restore();

  return fieldWidth;
};

const drawTextSegment = (doc, text, x, y, fontSize = 16) => {
  const segmentText = String(text ?? '');
  doc.save();
  doc.font('Helvetica').fontSize(fontSize).fillColor('#111827');
  const width = doc.widthOfString(segmentText);
  doc.text(segmentText, x, y, {
    lineBreak: false
  });
  doc.restore();
  return width;
};

const drawSegmentLine = (doc, segments, x, y) => {
  let cursorX = x;

  segments.forEach((segment) => {
    if (segment.type === 'field') {
      cursorX += drawField(doc, segment.value, cursorX, y, segment.width, segment);
      return;
    }

    cursorX += drawTextSegment(doc, segment.value, cursorX, y, segment.fontSize || 16);
  });
};

const drawParagraph = (doc, lines, x, y) => {
  const lineHeight = 26;
  lines.forEach((line, index) => drawSegmentLine(doc, line, x, y + (index * lineHeight)));
  return y + (lines.length * lineHeight);
};

const drawCertificatePdf = (doc, type, data = {}) => {
  const config = resolveTypeConfig(type);
  const now = new Date();
  const centerX = PAGE_WIDTH / 2;

  doc.addPage({ size: 'A4', margin: 0 });
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#ffffff');

  doc.save();
  doc.opacity(0.12);
  doc.image(ensureImagePath('New irawan logo.png'), centerX - 194, 190, { fit: [388, 388], align: 'center', valign: 'center' });
  doc.restore();

  doc.image(ensureImagePath('New irawan logo.png'), 68, 52, { fit: [72, 72] });
  doc.image(ensureImagePath('Bagong_Pilipinas_logo.png'), PAGE_WIDTH - 130, 56, { fit: [64, 64] });

  doc.save();
  doc.moveTo(56, 145).lineTo(PAGE_WIDTH - 56, 145).strokeColor('#1f2937').lineWidth(1.5).stroke();
  doc.restore();

  doc.save();
  doc.font('Helvetica').fillColor('#6b7280').fontSize(12).text('Republic of the Philippines', 140, 52, { width: CONTENT_WIDTH - 220, align: 'center' });
  doc.text('Province of Palawan', 140, 68, { width: CONTENT_WIDTH - 220, align: 'center' });
  doc.text('City of Puerto Princesa', 140, 84, { width: CONTENT_WIDTH - 220, align: 'center' });
  doc.font('Helvetica-Bold').fillColor('#111827').fontSize(26).text('BARANGAY IRAWAN', 140, 104, { width: CONTENT_WIDTH - 220, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(18).text(config.title, 140, 128, { width: CONTENT_WIDTH - 220, align: 'center' });
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text(config.bodyTitle, LEFT_MARGIN, 188, { width: CONTENT_WIDTH });

  const values = {
    FULL_NAME: data.FULL_NAME || '',
    AGE: data.AGE || '',
    BARANGAY: data.BARANGAY || 'Irawan',
    CITY: data.CITY || 'Puerto Princesa City',
    PROVINCE: data.PROVINCE || 'Palawan',
    PURPOSE: data.PURPOSE || '',
    DAY: data.DAY || String(now.getDate()),
    MONTH: data.MONTH || now.toLocaleString('en-US', { month: 'long' })
  };

  let bodyY = 230;
  config.paragraphLines.forEach((paragraph) => {
    bodyY = drawParagraph(doc, paragraph.map((line) => line.map((segment) => (
      segment.type === 'field' ? { ...segment, value: values[segment.key] } : segment
    ))), LEFT_MARGIN, bodyY);
    bodyY += 12;
  });

  doc.save();
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827');
  doc.text('FOR RESEARCH PURPOSES ONLY', 0, PAGE_HEIGHT - 24, { width: PAGE_WIDTH, align: 'center' });
  doc.restore();

  const secretaryY = 688;
  const captainY = 734;
  const signatureWidth = 180;

  doc.save();
  doc.moveTo(LEFT_MARGIN, secretaryY).lineTo(LEFT_MARGIN + signatureWidth, secretaryY).strokeColor('#1f2937').stroke();
  doc.moveTo(PAGE_WIDTH - LEFT_MARGIN - signatureWidth, captainY).lineTo(PAGE_WIDTH - LEFT_MARGIN, captainY).strokeColor('#1f2937').stroke();
  doc.restore();

  doc.save();
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827')
    .text(data.SECRETARY_NAME || 'Barangay Secretary', LEFT_MARGIN, secretaryY - 16, { width: signatureWidth, align: 'center' })
    .text('Barangay Secretary / Authorized Officer', LEFT_MARGIN, secretaryY + 6, { width: signatureWidth, align: 'center' })
    .text(data.CAPTAIN_NAME || 'Punong Barangay', PAGE_WIDTH - LEFT_MARGIN - signatureWidth, captainY - 16, { width: signatureWidth, align: 'center' })
    .text('Punong Barangay', PAGE_WIDTH - LEFT_MARGIN - signatureWidth, captainY + 6, { width: signatureWidth, align: 'center' });
  doc.restore();
};

const createDocumentPdfBuffer = async ({ type, data }) => createPdfBuffer((doc) => drawCertificatePdf(doc, type, data));

module.exports = {
  createDocumentPdfBuffer,
  drawCertificatePdf
};