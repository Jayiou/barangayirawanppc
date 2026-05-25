const fs = require('node:fs');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const formatLabel = (text) => {
    if (!text) return text;
    return text
        .replaceAll('_', ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizeDetailItems = (details = []) => {
    const entries = Array.isArray(details)
        ? details
        : Object.entries(details).map(([label, value]) => ({ label, value }));

    return entries
        .map((detail) => {
            const label = Array.isArray(detail) ? detail[0] : detail.label;
            const value = Array.isArray(detail) ? detail[1] : detail.value;
            return {
                label: String(label || '').trim(),
                value: String(value ?? '').trim()
            };
        })
        .filter((detail) => detail.label && detail.value);
};

const buildDetailsText = (details) => {
    const items = normalizeDetailItems(details);
    if (!items.length) return '';

    return `Request Details:\n${items.map((item) => `- ${item.label}: ${item.value}`).join('\n')}\n`;
};

const buildDetailsHtml = (details) => {
    const items = normalizeDetailItems(details);
    if (!items.length) return '';

    return `
        <div style="margin-top: 16px; padding: 12px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #235b82;">Request Details</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tbody>
                    ${items.map((item) => `
                        <tr>
                            <td style="padding: 6px 8px 6px 0; color: #555; font-weight: bold; vertical-align: top; width: 38%;">${escapeHtml(item.label)}</td>
                            <td style="padding: 6px 0; color: #222; vertical-align: top;">${escapeHtml(item.value)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
};

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SENDGRID_FROM || 'no-reply@barangay.local';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || FROM_EMAIL;

const hasValidFromDomain = !FROM_EMAIL.endsWith('.local') && !FROM_EMAIL.endsWith('.localhost');
if (process.env.SENDGRID_API_KEY && !hasValidFromDomain) {
    console.warn('Warning: SENDGRID_API_KEY is configured but EMAIL_FROM is not set to a real verified sender address. Set EMAIL_FROM to a valid, verified domain to improve deliverability.');
}

// Build transporter dynamically: prefer SendGrid API key (SMTP relay), fallback to EMAIL_USER/EMAIL_PASS
const smtpHost = process.env.EMAIL_HOST || 'smtp.sendgrid.net';
const smtpPort = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
const smtpSecure = smtpPort === 465;
const useSendGrid = Boolean(process.env.SENDGRID_API_KEY);

let smtpAuth = null;
if (process.env.SENDGRID_API_KEY) {
    smtpAuth = { user: 'apikey', pass: process.env.SENDGRID_API_KEY };
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    smtpAuth = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS };
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: true,
    auth: smtpAuth
});

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const normalizeSendGridAttachments = (attachments = []) => {
    return attachments.map((attachment) => {
        if (attachment.content) {
            return {
                ...attachment,
                content: typeof attachment.content === 'string' ? attachment.content : attachment.content.toString('base64')
            };
        }

        if (attachment.path) {
            const fileData = fs.readFileSync(attachment.path);
            return {
                filename: attachment.filename || attachment.path.split('/').pop(),
                type: attachment.contentType || 'application/octet-stream',
                content: fileData.toString('base64'),
                disposition: attachment.contentDisposition || 'attachment'
            };
        }

        return {
            filename: attachment.filename || 'attachment',
            content: String(attachment)
        };
    });
};

const sendMail = async (mailOptions) => {
    if (useSendGrid) {
        const sgMessage = {
            to: mailOptions.to,
            from: mailOptions.from,
            subject: mailOptions.subject,
            text: mailOptions.text,
            html: mailOptions.html,
            replyTo: mailOptions.replyTo,
            headers: mailOptions.headers,
            attachments: mailOptions.attachments ? normalizeSendGridAttachments(mailOptions.attachments) : undefined
        };

        return sgMail.send(sgMessage);
    }

    return transporter.sendMail(mailOptions);
};

// Default headers and reply-to for better deliverability when domain setup is limited.
const LIST_UNSUBSCRIBE = process.env.EMAIL_LIST_UNSUBSCRIBE || FROM_EMAIL;
const REPLY_TO = process.env.EMAIL_REPLY_TO || FROM_EMAIL;
const defaultMailHeaders = {
    'List-Unsubscribe': `<mailto:${LIST_UNSUBSCRIBE}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
};

const sendOtpEmail = async (toEmail, otpCode, name) => {
    try {
        const mailOptions = {
            from: `"Barangay Connect" <${FROM_EMAIL}>`,
            to: toEmail,
            subject: 'Verify your Barangay Connect Registration',
            replyTo: REPLY_TO,
            headers: defaultMailHeaders,
            text: `Hello ${name},\n\nThank you for registering. To complete your registration and proceed to Admin Approval, please verify your email using the OTP below:\n\n${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #235b82; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>Thank you for registering. To complete your registration and proceed to Admin Approval, please verify your email using the OTP below:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; background: #f6f0e6; padding: 10px 20px; border-radius: 6px; letter-spacing: 4px; color: #ba5b2a;">${otpCode}</span>
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="font-size: 12px; color: #888; margin-top: 40px; text-align: center;">If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        // Don't crash if email config is missing during dev testing
        if (!smtpAuth) {
            console.log('Skipping email send because no SendGrid API key or SMTP credentials are configured');
            return;
        }

        await sendMail(mailOptions);
        console.log(`OTP Email sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending OTP Email:', error);
        // We throw so the controller can handle it (optional)
    }
};


const sendPasswordResetEmail = async (toEmail, name, resetLink) => {
    try {
        const mailOptions = {
            from: `"Barangay Connect" <${FROM_EMAIL}>`,
            to: toEmail,
            subject: 'Reset your Barangay Connect password',
            replyTo: REPLY_TO,
            headers: defaultMailHeaders,
            text: `Hello ${name},\n\nWe received a request to reset your password. Please copy and paste the link below in your browser:\n\n${resetLink}\n\nThis link will expire in 30 minutes.\n\nIf you did not request this, you can ignore this email.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #235b82; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #235b82; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: bold; word-break: break-word;">Reset Password</a>
                    </div>
                    <p style="font-size: 12px; color: #666; margin: 20px 0; text-align: center; word-break: break-all;">Or copy and paste this link in your browser: <br /><a href="${resetLink}" style="color: #235b82; text-decoration: underline; word-break: break-all;">${resetLink}</a></p>
                    <p>This link will expire in <strong>30 minutes</strong>.</p>
                    <p style="font-size: 12px; color: #888; margin-top: 40px; text-align: center;">If you did not request this, you can ignore this email and your password will remain unchanged.</p>
                </div>
            `
        };

        if (!smtpAuth) {
            console.log('Skipping password reset email because no SendGrid API key or SMTP credentials are configured');
            return;
        }

        await sendMail(mailOptions);
        console.log(`Password reset email sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending Password Reset Email:', error);
    }
};

const sendStatusUpdateEmail = async (toEmail, name, status) => {
    try {
        const isApproved = status === 'approved';
        const statusColor = isApproved ? '#2e7d32' : '#d32f2f'; // Green or Red
        const statusMessage = isApproved 
            ? 'Congratulations! Your account registration has been <strong>APPROVED</strong> by the Barangay Admin. You may now login to the portal.'
            : 'We regret to inform you that your account registration has been <strong>REJECTED</strong>. Please ensure all your details and proof of residency are correct, and try registering again or visit the Barangay Hall for clarification.';
        const forgotPasswordReminderText = isApproved
            ? '\n\nIf you forgot your password, click the Forgot Password button in the login form and provide your registered email to reset your password.'
            : '';
        const forgotPasswordReminderHtml = isApproved
            ? `
                    <div style="padding: 12px; border-left: 5px solid #235b82; background-color: #f2f8fd; margin: 16px 0;">
                        <p style="margin: 0; font-size: 14px; color: #1f3e58;">
                            If you forgot your password, click the <strong>Forgot Password</strong> button in the login form and provide your registered email to reset your password.
                        </p>
                    </div>
                `
            : '';

        const mailOptions = {
            from: `"Barangay Connect" <${FROM_EMAIL}>`,
            to: toEmail,
            subject: `Barangay Connect - Registration ${isApproved ? 'Approved' : 'Rejected'}`,
            replyTo: REPLY_TO,
            headers: defaultMailHeaders,
            text: `Hello ${name},\n\n${statusMessage.replace(/<[^>]+>/g, '')}${forgotPasswordReminderText}\n\nThank you,\nBarangay Administration`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #235b82; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid ${statusColor}; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
                    </div>
                    ${forgotPasswordReminderHtml}
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                </div>
            `
        };

        if (!smtpAuth) {
            console.log('Skipping email send because no SendGrid API key or SMTP credentials are configured');
            return;
        }

        await sendMail(mailOptions);
        console.log(`Status Email sent to ${toEmail} for status: ${status}`);
    } catch (error) {
        console.error('Error sending Status Update Email:', error);
    }
};


const sendDocumentStatusEmail = async (toEmail, name, documentType, status, adminNotes, details = []) => {
    try {
        const docTypeFormatted = formatLabel(documentType);
        let statusMessage = '';
        let statusColor;

        if (status === 'approved') {
            statusMessage = 'Great news! Your request for <strong>' + docTypeFormatted + '</strong> has been <strong>APPROVED</strong>. We are now preparing your document.';
            statusColor = '#2e7d32';
        } else if (status === 'processing') {
            statusMessage = 'Your request for <strong>' + docTypeFormatted + '</strong> is now <strong>Processing</strong>. Our staff is preparing your document.';
            statusColor = '#cc7000';
        } else if (status === 'ready_for_pickup') {
            statusMessage = 'Excellent! Your request for <strong>' + docTypeFormatted + '</strong> is now <strong>Ready for Pickup</strong> at the Barangay Hall.';
            statusColor = '#257f49';
        } else if (status === 'rejected') {
            statusMessage = 'Your request for <strong>' + docTypeFormatted + '</strong> has been <strong>Rejected</strong>. ' + (adminNotes ? 'Please see the admin notes below for details.' : '');
            statusColor = '#d52a2a';
        } else if (status === 'completed') {
            statusMessage = 'Thank you! Your request for <strong>' + docTypeFormatted + '</strong> has been marked as <strong>Completed</strong>. We hope the document serves you well.';
            statusColor = '#235b82';
        } else {
            return; // Don't send email for pending or cancelled states unless specified
        }

        const notesSection = adminNotes ? `<div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px dashed #ccc; font-style: italic;"><strong>Admin Note:</strong> ${escapeHtml(adminNotes)}</div>` : '';
        const adminNoteText = adminNotes ? `Admin Note: ${adminNotes}\n` : '';
        const detailsText = buildDetailsText(details);
        const detailsSection = buildDetailsHtml(details);

        const mailOptions = {
            from: `"Barangay Connect" <${FROM_EMAIL}>`,
            to: toEmail,
            subject: `Barangay Connect - Document Request Update: ${formatLabel(status)}`,
            replyTo: REPLY_TO,
            headers: defaultMailHeaders,
            text: `Hello ${name},\n\n${statusMessage.replace(/<[^>]+>/g, '')}\n\n${detailsText}${adminNoteText}\nThank you,\nBarangay Administration`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid ${statusColor}; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
                        ${detailsSection}
                        ${notesSection}
                    </div>
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                </div>
            `
        };

        if (!smtpAuth) {
            console.log('Skipping document email send because no SendGrid API key or SMTP credentials are configured');
            return;
        }

        await sendMail(mailOptions);
        console.log('Document Status Email sent to ' + toEmail + ' for status: ' + status);
    } catch (error) {
        console.error('Error sending Document Status Update Email:', error);
    }
};

const sendRequestStatusEmail = async (toEmail, name, requestLabel, status, adminNotes, details = []) => {
    try {
        const normalizedStatus = String(status || '').toLowerCase();
        const formattedLabel = formatLabel(requestLabel);
        let statusMessage = '';
        let statusColor = '#235b82';

        if (['approved', 'resolved', 'completed'].includes(normalizedStatus)) {
            statusMessage = `Good news! Your ${formattedLabel} request has been <strong>${normalizedStatus.toUpperCase()}</strong>.`;
            statusColor = '#2e7d32';
        } else if (['rejected', 'cancelled'].includes(normalizedStatus)) {
            statusMessage = `Your ${formattedLabel} request has been <strong>${normalizedStatus.toUpperCase()}</strong>.`;
            statusColor = '#d32f2f';
        } else if (normalizedStatus === 'rescheduled') {
            statusMessage = `Your ${formattedLabel} request has been <strong>RESCHEDULED</strong>. Please review the updated schedule.`;
            statusColor = '#cc7000';
        } else if (['reviewing', 'in_progress', 'processing'].includes(normalizedStatus)) {
            statusMessage = `Your ${formattedLabel} request is now <strong>${normalizedStatus.replace('_', ' ').toUpperCase()}</strong>.`;
            statusColor = '#cc7000';
        } else {
            statusMessage = `Your ${formattedLabel} request status has been updated to <strong>${formatLabel(normalizedStatus)}</strong>.`;
        }

        const notesSection = adminNotes ? `<div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px dashed #ccc; font-style: italic;"><strong>Admin Note:</strong> ${escapeHtml(adminNotes)}</div>` : '';
        const adminNoteText = adminNotes ? `Admin Note: ${adminNotes}\n` : '';
        const detailsText = buildDetailsText(details);
        const detailsSection = buildDetailsHtml(details);

        const mailOptions = {
            from: `"Barangay Connect" <${FROM_EMAIL}>`,
            to: toEmail,
            subject: `Barangay Connect - ${formattedLabel} Update: ${formatLabel(normalizedStatus)}`,
            replyTo: REPLY_TO,
            headers: defaultMailHeaders,
            text: `Hello ${name},\n\n${statusMessage.replace(/<[^>]+>/g, '')}\n\n${detailsText}${adminNoteText}\nThank you,\nBarangay Administration`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid ${statusColor}; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
                        ${detailsSection}
                        ${notesSection}
                    </div>
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                </div>
            `
        };

        if (!smtpAuth) {
            console.log('Skipping request status email because no SendGrid API key or SMTP credentials are configured');
            return;
        }

        await sendMail(mailOptions);
        console.log(`Request Status Email sent to ${toEmail} for status: ${status}`);
    } catch (error) {
        console.error('Error sending Request Status Update Email:', error);
    }
};

const sendGeneratedDocumentEmail = async (toEmail, name, documentType, filePath) => {
    try {
        const docTypeFormatted = formatLabel(documentType);
        let htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid #257f49; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">Your requested <strong>${docTypeFormatted}</strong> is now ready!</p>
                    </div>
                    <p><strong>Document Details:</strong></p>
                    <ul style="line-height: 1.8;">
                        <li><strong>Document Type:</strong> ${docTypeFormatted}</li>
                        <li><strong>Issued by:</strong> Barangay Irawan, Puerto Princesa City</li>
                        <li><strong>Date Issued:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
                    </ul>
                    <p style="margin-top: 20px;">If you have any questions or concerns about your document, please don't hesitate to contact the Barangay Hall.</p>
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 30px;">
                    <p style="font-size: 12px; color: #888; text-align: center;">This is an automated email. Please do not reply to this address.</p>
                </div>
            `;

        const textBody = `Hello ${name},\n\nYour requested ${docTypeFormatted} is now ready!\n\nDocument Details:\n- Document Type: ${docTypeFormatted}\n- Issued by: Barangay Irawan, Puerto Princesa City\n- Date Issued: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\nIf you have any questions or concerns about your document, please don't hesitate to contact the Barangay Hall.\n\nThank you,\nBarangay Administration`;

        const mailOptions = {
            from: `"Barangay Connect" <${FROM_EMAIL}>`,
            to: toEmail,
            subject: `${docTypeFormatted} from Barangay Irawan`,
            replyTo: REPLY_TO,
            headers: defaultMailHeaders,
            text: textBody,
            html: htmlBody
        };

        // If filePath is remote (presigned URL), include link in email instead of attachment
        if (typeof filePath === 'string' && (filePath.startsWith('http://') || filePath.startsWith('https://')) ) {
            mailOptions.text = textBody + `\n\nDownload Link: ${filePath}`;
            mailOptions.html = htmlBody + `\n<p style="margin-top:12px; text-align:center;"><a href="${filePath}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#257f49; color:#fff; padding:10px 14px; border-radius:6px; text-decoration:none;">Download Document</a></p>`;
        } else if (typeof filePath === 'string' && filePath) {
            mailOptions.attachments = [{ filename: `${documentType}.pdf`, path: filePath }];
        }
        

        if (!smtpAuth) {
            console.log('Skipping document email send because no SendGrid API key or SMTP credentials are configured');
            return;
        }

        await sendMail(mailOptions);
        console.log(`Generated document email sent to ${toEmail} for document: ${documentType}`);
    } catch (error) {
        console.error('Error sending generated document email:', error);
        throw error;
    }
};

const sendCustomResidentEmail = async (toEmail, name, subject, message) => {
    try {
        const mailOptions = {
            from: `"Barangay Connect" <${FROM_EMAIL}>`,
            to: toEmail,
            subject: subject || 'Barangay Resident Notification',
            replyTo: REPLY_TO,
            headers: defaultMailHeaders,
            text: `Hello ${name || 'Resident'},\n\n${(message || '').replace(/<[^>]+>/g, '')}\n\nThank you,\nBarangay Administration`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name || 'Resident'}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid #235b82; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px; white-space: pre-wrap;">${String(message || '').trim()}</p>
                    </div>
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                </div>
            `
        };

        if (!smtpAuth) {
            console.log('Skipping custom resident email because no SendGrid API key or SMTP credentials are configured');
            return;
        }

        await sendMail(mailOptions);
        console.log(`Custom resident email sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending custom resident email:', error);
    }
};

module.exports = {
    sendOtpEmail,
    sendPasswordResetEmail,
    sendStatusUpdateEmail,
    sendDocumentStatusEmail,
    sendRequestStatusEmail,
    sendGeneratedDocumentEmail,
    sendCustomResidentEmail
};
