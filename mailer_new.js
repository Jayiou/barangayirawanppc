
const sendDocumentStatusEmail = async (toEmail, name, documentType, status, adminNotes) => {
    try {
        let statusMessage = '';
        let statusColor;
        
        if (status === 'ready_for_pickup') {
            statusMessage = 'Your request for <strong>' + documentType + '</strong> is now <strong>Ready for Pickup</strong> at the Barangay Hall.';
            statusColor = '#257f49';
        } else if (status === 'rejected') {
            statusMessage = 'Your request for <strong>' + documentType + '</strong> has been <strong>Rejected</strong>.';
            statusColor = '#d52a2a';
        } else if (status === 'processing') {
            statusMessage = 'Your request for <strong>' + documentType + '</strong> is now <strong>Processing</strong>.';
            statusColor = '#cc7000';
        } else {
            return; // Don't send email for pending or other intermediate states unless specified
        }

        const notesSection = adminNotes ? '<div style="margin-top: 15px; padding: 10px; background: #fff; border: 1px dashed #ccc; font-style: italic;"><strong>Admin Note:</strong> ' + adminNotes + '</div>' : '';

        const mailOptions = {
            from: '"Barangay Connect" <' + process.env.EMAIL_USER + '>',
            to: toEmail,
            subject: 'Barangay Connect - Document Request Update: ' + status.replace('_', ' ').toUpperCase(),
            html: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">\n' +
                  '    <h2 style="color: #257f49; text-align: center;">Barangay Connect</h2>\n' +
                  '    <p>Hello <strong>' + name + '</strong>,</p>\n' +
                  '    <div style="padding: 15px; border-left: 5px solid ' + statusColor + '; background-color: #f9f9f9; margin: 20px 0;">\n' +
                  '        <p style="margin: 0; font-size: 16px;">' + statusMessage + '</p>\n' +
                           notesSection + '\n' +
                  '    </div>\n' +
                  '    <p>Thank you,</p>\n' +
                  '    <p><strong>Barangay Administration</strong></p>\n' +
                  '</div>'
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
