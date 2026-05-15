const nodemailer = require('nodemailer');

const formatLabel = (text) => {
    if (!text) return text;
    return text
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // You'll need to set these in your .env file
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

const sendOtpEmail = async (toEmail, otpCode, name) => {
    try {
        const mailOptions = {
            from: `"Barangay Connect" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Verify your Barangay Connect Registration',
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
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Skipping email send because EMAIL_USER/EMAIL_PASS are missing in .env');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`OTP Email sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending OTP Email:', error);
        // We throw so the controller can handle it (optional)
    }
};

const sendPasswordResetEmail = async (toEmail, name, resetLink) => {
    try {
        const mailOptions = {
            from: `"Barangay Connect" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Reset your Barangay Connect password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #235b82; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <p>We received a request to reset your password. Click the button below to choose a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="display: inline-block; background: #235b82; color: #ffffff; text-decoration: none; padding: 14px 24px; border-radius: 6px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>This link will expire in <strong>30 minutes</strong>.</p>
                    <p style="font-size: 12px; color: #888; margin-top: 40px; text-align: center;">If you did not request this, you can ignore this email and your password will remain unchanged.</p>
                </div>
            `
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Skipping password reset email because EMAIL_USER/EMAIL_PASS are missing in .env');
            return;
        }

        await transporter.sendMail(mailOptions);
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

        const mailOptions = {
            from: `"Barangay Connect" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Barangay Connect - Registration ${isApproved ? 'Approved' : 'Rejected'}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #235b82; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid ${statusColor}; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
                    </div>
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                </div>
            `
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Skipping email send because EMAIL_USER/EMAIL_PASS are missing in .env');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`Status Email sent to ${toEmail} for status: ${status}`);
    } catch (error) {
        console.error('Error sending Status Update Email:', error);
    }
};


const sendDocumentStatusEmail = async (toEmail, name, documentType, status, adminNotes) => {
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

        const notesSection = adminNotes ? `<div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px dashed #ccc; font-style: italic;"><strong>Admin Note:</strong> ${adminNotes}</div>` : '';

        const mailOptions = {
            from: `"Barangay Connect" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Barangay Connect - Document Request Update: ${formatLabel(status)}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid ${statusColor}; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
                        ${notesSection}
                    </div>
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                </div>
            `
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Skipping document email send because EMAIL_USER/EMAIL_PASS are missing in .env');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log('Document Status Email sent to ' + toEmail + ' for status: ' + status);
    } catch (error) {
        console.error('Error sending Document Status Update Email:', error);
    }
};

const sendRequestStatusEmail = async (toEmail, name, requestLabel, status, adminNotes) => {
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

        const notesSection = adminNotes ? `<div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px dashed #ccc; font-style: italic;"><strong>Admin Note:</strong> ${adminNotes}</div>` : '';

        const mailOptions = {
            from: `"Barangay Connect" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Barangay Connect - ${formattedLabel} Update: ${formatLabel(normalizedStatus)}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid ${statusColor}; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
                        ${notesSection}
                    </div>
                    <p>Thank you,</p>
                    <p><strong>Barangay Administration</strong></p>
                </div>
            `
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Skipping request status email because EMAIL_USER/EMAIL_PASS are missing in .env');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`Request Status Email sent to ${toEmail} for status: ${status}`);
    } catch (error) {
        console.error('Error sending Request Status Update Email:', error);
    }
};

const sendGeneratedDocumentEmail = async (toEmail, name, documentType, filePath) => {
    try {
        const docTypeFormatted = formatLabel(documentType);
        
        const mailOptions = {
            from: `"Barangay Connect" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `${docTypeFormatted} from Barangay Irawan`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>
                    <p>Hello <strong>${name}</strong>,</p>
                    <div style="padding: 15px; border-left: 5px solid #257f49; background-color: #f9f9f9; margin: 20px 0;">
                        <p style="margin: 0; font-size: 16px;">Your requested <strong>${docTypeFormatted}</strong> is now ready! Please find the document attached to this email.</p>
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
            `,
            attachments: [
                {
                    filename: `${documentType}.pdf`,
                    path: filePath
                }
            ]
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Skipping document email send because EMAIL_USER/EMAIL_PASS are missing in .env');
            return;
        }

        await transporter.sendMail(mailOptions);
        console.log(`Generated document email sent to ${toEmail} for document: ${documentType}`);
    } catch (error) {
        console.error('Error sending generated document email:', error);
        throw error;
    }
};

module.exports = {
    sendOtpEmail,
    sendPasswordResetEmail,
    sendStatusUpdateEmail,
    sendDocumentStatusEmail,
    sendRequestStatusEmail,
    sendGeneratedDocumentEmail
};
