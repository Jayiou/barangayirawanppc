const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const Official = require('../models/Official');

// Persistent browser instance to avoid launch overhead
let browserInstance = null;

/**
 * Get or create a persistent Puppeteer browser instance.
 * @returns {Promise<Object>}
 */
const getBrowser = async () => {
    if (browserInstance) {
        return browserInstance;
    }

    try {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Puppeteer browser instance created and cached.');
        return browserInstance;
    } catch (error) {
        console.error('Failed to launch Puppeteer browser:', error);
        throw error;
    }
};

/**
 * Gracefully close the persistent browser instance.
 */
const closeBrowser = async () => {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
        console.log('Puppeteer browser instance closed.');
    }
};

// Map documentType to template document title
const documentTypeMap = {
    certificate_of_residency: 'Certificate of Residency',
    certificate_of_indigency: 'Certificate of Indigency',
    barangay_clearance: 'Barangay Clearance'
};

// Field mapping for each document type
const fieldMappings = {
    certificate_of_residency: {
        name: 'cert_name',
        purok: 'cert_purok',
        record: 'cert_record',
        since: 'cert_since',
        day: 'cert_day',
        month: 'cert_month',
        year: 'cert_year',
        secretary: 'cert_punong_barangay',
        punongBarangay: 'cert_secretary'
    },
    certificate_of_indigency: {
        name: 'ind_name',
        residence: 'ind_residence',
        status: 'ind_status',
        income: 'ind_income',
        dependents: 'ind_dependents',
        dateIssued: 'date_issued_ind',
        secretary: 'ind_punong_barangay',
        punongBarangay: 'ind_secretary'
    },
    barangay_clearance: {
        name: 'clr_name',
        residence: 'clr_residence',
        purpose: 'clr_purpose',
        ctc: 'clr_ctc',
        dateIssued: 'date_issued_clr',
        secretary: 'clr_punong_barangay',
        punongBarangay: 'clr_secretary'
    }
};

/**
 * Get official names from the Official model
 * @returns {Object} Object with punongBarangay and secretary names
 */
const fetchOfficialNames = async () => {
    try {
        const punongBarangay = await Official.findOne({ 
            position: 'Barangay Captain', 
            status: 'active' 
        });
        const secretary = await Official.findOne({ 
            position: 'Barangay Secretary', 
            status: 'active' 
        });

        return {
            punongBarangay: punongBarangay?.name || 'Barangay Captain',
            secretary: secretary?.name || 'Barangay Secretary'
        };
    } catch (error) {
        console.error('Error fetching official names:', error);
        return {
            punongBarangay: 'Barangay Captain',
            secretary: 'Barangay Secretary'
        };
    }
};

/**
 * Format date to readable string (e.g., "14 May 2026")
 * @param {Date} date
 * @returns {String}
 */
const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
};

/**
 * Extract day, month, year from a date
 * @param {Date} date
 * @returns {Object}
 */
const getDateParts = (date) => {
    const d = new Date(date);
    return {
        day: d.getDate().toString(),
        month: d.toLocaleString('en-US', { month: 'long' }),
        year: d.getFullYear().toString()
    };
};

/**
 * Convert an image file to a data URI for Puppeteer rendering.
 * @param {String} imagePath
 * @returns {String}
 */
const imageToDataUri = (imagePath) => {
    const imageBuffer = fs.readFileSync(imagePath);
    const extension = path.extname(imagePath).toLowerCase();
    const mimeTypeMap = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp'
    };

    const mimeType = mimeTypeMap[extension] || 'application/octet-stream';
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
};

/**
 * Replace template image sources with inline data URIs so Puppeteer can render them.
 * @param {String} htmlContent
 * @returns {String}
 */
const inlineDocumentImages = (htmlContent) => {
    const imageMap = {
        'frontend/public/images/hero-logo.png': path.join(__dirname, '../frontend/public/images/hero-logo.png'),
        'frontend/public/images/Bagong_Pilipinas_logo.png': path.join(__dirname, '../frontend/public/images/Bagong_Pilipinas_logo.png')
    };

    return Object.entries(imageMap).reduce((content, [templateSrc, imagePath]) => {
        if (!fs.existsSync(imagePath)) {
            return content;
        }

        return content.replaceAll(templateSrc, imageToDataUri(imagePath));
    }, htmlContent);
};

/**
 * Build resident name from DocumentRequest
 * @param {Object} documentRequest
 * @returns {String}
 */
const buildResidentName = (documentRequest) => {
    const parts = [
        documentRequest.firstName?.trim(),
        documentRequest.middleName?.trim(),
        documentRequest.lastName?.trim(),
        documentRequest.suffix?.trim()
    ].filter(Boolean);
    
    return parts.join(' ').trim();
};

/**
 * Load and fill the HTML template with document data
 * @param {Object} documentRequest
 * @param {String} documentType
 * @param {Object} officialNames
 * @returns {String} HTML string with filled data
 */
const loadAndFillTemplate = (documentRequest, documentType, officialNames) => {
    const templateMap = {
        certificate_of_residency: path.join(__dirname, '../Certification/certificate_of_residency_template.html'),
        certificate_of_indigency: path.join(__dirname, '../Certification/certificate_of_indigency_template.html'),
        barangay_clearance: path.join(__dirname, '../Certification/barangay_clearance_template.html')
    };

    const templatePath = templateMap[documentType];
    const stylesPath = path.join(__dirname, '../Certification/barangay_documents_styles.css');

    if (!templatePath) {
        throw new Error(`Unknown document type: ${documentType}`);
    }

    const templateFragment = fs.readFileSync(templatePath, 'utf-8');
    const styles = fs.readFileSync(stylesPath, 'utf-8');

    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${documentTypeMap[documentType] || 'Barangay Document'}</title>
    <style>${styles}</style>
</head>
<body>
    <main class="document">
${templateFragment}
    </main>
</body>
</html>`;

    htmlContent = inlineDocumentImages(htmlContent);
    
    // Get field mappings for this document type
    const fields = fieldMappings[documentType];
    
    if (!fields) {
        throw new Error(`Unknown document type: ${documentType}`);
    }

    // Get current date parts
    const now = new Date();
    const dateParts = getDateParts(now);

    // Build replacement data
    const residentName = buildResidentName(documentRequest);
    const address = documentRequest.address || '';

    // Create a map of field name to value
    const replacements = {
        [fields.name]: residentName,
        [fields.residence]: address,
        [fields.dateIssued]: documentType === 'barangay_clearance' ? formatDate(now) : dateParts.day,
        [fields.secretary]: officialNames.secretary,
        [fields.punongBarangay]: officialNames.punongBarangay
    };

    // Document-type-specific fields
    if (documentType === 'certificate_of_residency') {
        replacements[fields.purok] = documentRequest.purok || '';
        replacements[fields.record] = documentRequest.businessRecord || '';
        replacements[fields.since] = documentRequest.residingSince || '';
        replacements[fields.day] = dateParts.day;
        replacements[fields.month] = dateParts.month;
        replacements[fields.year] = dateParts.year;
    } else if (documentType === 'certificate_of_indigency') {
        replacements[fields.status] = documentRequest.householdStatus || 'Single';
        replacements[fields.income] = documentRequest.monthlyIncome || '';
        replacements[fields.dependents] = documentRequest.numDependents || '0';
    } else if (documentType === 'barangay_clearance') {
        replacements[fields.purpose] = documentRequest.purpose || '';
        replacements[fields.ctc] = documentRequest.ctcNumber || '';
    }

    // Replace all input field values in the template
    htmlContent = htmlContent.replace(/type="text"|type="select"/g, (match) => {
        // This will be handled by replacing the name attributes with values
        return match;
    });

    // Replace input field values by finding input elements and replacing their next value
    // More sophisticated: find each input by name and set its value
    Object.entries(replacements).forEach(([fieldName, fieldValue]) => {
        // Replace input field value
        const inputRegex = new RegExp(String.raw`(<input[^>]*?name=["']${fieldName}["'][^>]*?)(?:\s*/>|(?:>.*?</input>))`, 'gi');
        htmlContent = htmlContent.replace(inputRegex, (match) => {
            // Add value attribute
            if (match.includes('value=')) {
                return match.replace(/value=["'][^"']*["']/, `value="${fieldValue}"`);
            } else if (match.includes('/>')) {
                return match.replace('/>', ` value="${fieldValue}" />`);
            } else {
                return match;
            }
        });

        // Replace select field value (for household status)
        const selectRegex = new RegExp(
            `(<select[^>]*?name=["']${fieldName}["'][^>]*?>.*?</select>)`,
            'gi'
        );
        htmlContent = htmlContent.replace(selectRegex, (match) => {
            // Set selected option
            return match.replace(
                /(<option[^>]*value=["']([^"']*)["'][^>]*>)/g,
                (optionMatch, p1, optionValue) => {
                    if (optionValue === fieldValue) {
                        return p1.replace('>', ' selected>');
                    }
                    return optionMatch;
                }
            );
        });
    });

    return htmlContent;
};

/**
 * Generate PDF from filled template
 * @param {Object} documentRequest
 * @param {String} documentType
 * @returns {String} Path to generated PDF
 */
const generateDocumentPDF = async (documentRequest, documentType) => {
    let page = null;
    try {
        // Fetch official names
        const officialNames = await fetchOfficialNames();

        // Load and fill template
        const htmlContent = loadAndFillTemplate(documentRequest, documentType, officialNames);

        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, '../private/uploads/documents');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate filename with date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `${documentRequest._id}-${documentType}-${dateStr}.pdf`;
        const filepath = path.join(outputDir, filename);

        // Get persistent browser instance (avoids launch overhead)
        const browser = await getBrowser();
        page = await browser.newPage();

        // Set page content with static HTML (use domcontentloaded since no external resources)
        await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 10000 });

        // Generate PDF
        await page.pdf({
            path: filepath,
            format: 'A4',
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            },
            printBackground: true
        });

        console.log(`Document generated successfully: ${filepath}`);
        
        // Return relative path for storage in DB
        return path.relative(path.join(__dirname, '../'), filepath);
    } catch (error) {
        console.error('Error generating document PDF:', error);
        // Reset browser on error to prevent cascading failures
        if (browserInstance) {
            try {
                await browserInstance.close();
                browserInstance = null;
                console.log('Browser instance reset due to error');
            } catch (closeErr) {
                console.error('Failed to close browser on error:', closeErr);
                browserInstance = null;
            }
        }
        throw error;
    } finally {
        // Always close the page, but keep the browser for reuse
        if (page) {
            try {
                await page.close();
            } catch (closeErr) {
                console.error('Failed to close page:', closeErr);
            }
        }
    }
};

module.exports = {
    generateDocumentPDF,
    loadAndFillTemplate,
    fetchOfficialNames,
    formatDate,
    buildResidentName,
    closeBrowser
};
