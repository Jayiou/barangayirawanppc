const Resident = require('../models/Resident');
const User = require('../models/User');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const asyncHandler = require('../utils/asyncHandler');
const { createHttpError } = require('../utils/httpError');
const { sendStatusUpdateEmail, sendPasswordResetEmail, sendCustomResidentEmail } = require('../utils/mailer');
const { sendStatusUpdateSMS, sendSmsNotification } = require('../utils/sms');
const s3 = require('../utils/s3');
const { privateProofUploadDirectory } = require('../utils/uploadPaths');
const { persistPublicUpload } = require('../utils/publicUploadStorage');

const residentProfileFields = [
    'firstName',
    'middleName',
    'lastName',
    'suffix',
    'sex',
    'birthDate',
    'civilStatus',
    'contactNumber',
    'email',
    'address',
    'purok',
    'zone',
    'houseNumber',
    'streetAddress',
    'citizenship',
    'occupation',
    'voterStatus',
    'profileImage',
    'householdMemberCount',
    'householdId',
    'medicalConditions',
    'floodProneArea',
    'evacuationPriority',
    'verificationStatus',
    'verificationRemarks',
    'validIdPath',
    'selfieVerificationPath'
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizePublicUploadUrl = (value) => {
    const rawValue = String(value || '').trim();
    if (!rawValue) {
        return '';
    }

    if (/^https?:\/\//i.test(rawValue) || rawValue.startsWith('/uploads/')) {
        return rawValue;
    }

    const filename = path.basename(rawValue.split('?')[0].split('#')[0]);
    return filename ? `/uploads/${encodeURI(filename)}` : '';
};

const getFrontendBaseUrl = (req) => {
    const configuredOrigin = String(process.env.APP_URL || process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
    if (configuredOrigin) {
        return configuredOrigin;
    }

    const requestOrigin = String(req?.headers?.origin || '').trim().replace(/\/$/, '');
    if (requestOrigin) {
        return requestOrigin;
    }

    const host = req?.get?.('host') || req?.headers?.host || 'localhost:5000';
    const protocol = req?.protocol || 'http';
    return `${protocol}://${host}`.replace(/\/$/, '');
};

const serializeResident = (resident) => {
    if (!resident) {
        return resident;
    }

    const output = resident.toObject ? resident.toObject() : { ...resident };
    const profileImage = normalizePublicUploadUrl(output.profileImage);
    if (profileImage) {
        output.profileImage = profileImage;
    } else {
        delete output.profileImage;
    }
    return output;
};

const pickResidentFields = (source) => residentProfileFields.reduce((accumulator, field) => {
    if (source[field] !== undefined) {
        accumulator[field] = source[field];
    }

    return accumulator;
}, {});

const validateRequiredResidentFields = (payload) => {
    const requiredFields = ['firstName', 'lastName', 'sex', 'birthDate', 'address'];
    const missingFields = requiredFields.filter((field) => !payload[field]);

    return missingFields;
};

const validateResidentData = (payload) => {
    if (payload.email !== undefined && payload.email !== '' && !emailRegex.test(String(payload.email).trim())) {
        return 'Please provide a valid resident email address';
    }

    if (payload.birthDate !== undefined) {
        const birthDate = new Date(payload.birthDate);
        if (Number.isNaN(birthDate.getTime())) {
            return 'Please provide a valid birthDate';
        }
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) age -= 1;
        if (age < 0) return 'Birth date cannot be in the future';
        if (age > 120) return 'Age cannot exceed 120 years';
    }

    if (payload.evacuationPriority !== undefined && !['', 'low', 'medium', 'high', 'critical'].includes(String(payload.evacuationPriority))) {
        return 'Please provide a valid evacuationPriority';
    }
    if (payload.verificationStatus !== undefined && !['pending_review', 'under_verification', 'verified', 'rejected', 'needs_reupload'].includes(String(payload.verificationStatus))) {
        return 'Please provide a valid verificationStatus';
    }

    return null;
};

// CREATE
exports.createResident = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const residentData = pickResidentFields(req.body);
    const missingFields = validateRequiredResidentFields(residentData);
    const validationError = validateResidentData(residentData);

    if (!userId) {
        throw createHttpError(400, 'userId is required', { code: 'RESIDENT_VALIDATION_ERROR' });
    }

    if (missingFields.length > 0) {
        throw createHttpError(400, `Missing required fields: ${missingFields.join(', ')}`, { code: 'RESIDENT_VALIDATION_ERROR' });
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'RESIDENT_VALIDATION_ERROR' });
    }

    const user = await User.findById(userId);

    if (!user) {
        throw createHttpError(404, 'User not found', { code: 'RESIDENT_USER_NOT_FOUND' });
    }

    if (!residentData.email && user.email) {
        residentData.email = user.email;
    }

    if (user.role !== 'resident') {
        throw createHttpError(400, 'Profile can only be created for resident users', { code: 'RESIDENT_VALIDATION_ERROR' });
    }

    const existingResident = await Resident.findOne({ userId });

    if (existingResident) {
        throw createHttpError(409, 'Resident profile already exists for this user', { code: 'RESIDENT_CONFLICT' });
    }

    const resident = await Resident.create({
        userId,
        ...residentData
    });

    const populatedResident = await Resident.findById(resident._id)
        .populate('userId', 'username email role isActive createdAt');

    res.status(201).json(serializeResident(populatedResident));
});

// GET ALL
exports.getResidents = asyncHandler(async (req, res) => {
    const residents = await Resident.find()
        .populate('userId', 'username email role isActive accountStatus createdAt')
        .sort({ createdAt: -1 });

    // Filter out residents whose user accounts have been deleted
    const activeResidents = residents.filter(resident => resident.userId !== null && resident.userId !== undefined);

    res.json(activeResidents.map(serializeResident));
});

exports.getResidentById = asyncHandler(async (req, res) => {
    const resident = await Resident.findById(req.params.id)
        .populate('userId', 'username email role isActive accountStatus createdAt');

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    res.json(serializeResident(resident));
});

exports.downloadResidentProof = asyncHandler(async (req, res) => {
    const resident = await Resident.findById(req.params.id).select('proofOfResidency');

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    if (!resident.proofOfResidency) {
        throw createHttpError(404, 'Proof of residency not found', { code: 'RESIDENT_PROOF_NOT_FOUND' });
    }

    const storedProof = String(resident.proofOfResidency || '').trim();
    if (storedProof.startsWith('proofs/')) {
        if (!s3.isConfigured()) {
            throw createHttpError(404, 'Proof of residency storage is not configured.', { code: 'RESIDENT_PROOF_NOT_FOUND' });
        }

        try {
            const proofObject = await s3.getObject(storedProof);
            if (proofObject.ContentType) {
                res.setHeader('Content-Type', proofObject.ContentType);
            }
            if (proofObject.ContentLength) {
                res.setHeader('Content-Length', String(proofObject.ContentLength));
            }
            return proofObject.Body.pipe(res);
        } catch (error) {
            if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
                throw createHttpError(404, 'Proof of residency file not found', { code: 'RESIDENT_PROOF_NOT_FOUND' });
            }
            throw error;
        }
    }

    const filename = path.basename(storedProof);
    const privatePath = path.join(privateProofUploadDirectory, filename);
    const legacyPublicPath = path.join(__dirname, '../public/uploads', filename);
    const proofPath = fs.existsSync(privatePath) ? privatePath : legacyPublicPath;

    if (!fs.existsSync(proofPath)) {
        return res.status(404).json({
            success: false,
            message: 'Proof of residency file not found',
            code: 'RESIDENT_PROOF_NOT_FOUND'
        });
    }

    res.sendFile(proofPath);
});

exports.getMyResidentProfile = asyncHandler(async (req, res) => {
    const resident = await Resident.findOne({ userId: req.user.id })
        .populate('userId', 'username email role isActive createdAt');

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    res.json(serializeResident(resident));
});

exports.upsertMyResidentProfile = asyncHandler(async (req, res) => {
    const residentData = pickResidentFields(req.body);
    const validationError = validateResidentData(residentData);

    if (req.file?.filename) {
        await persistPublicUpload(req.file);
        residentData.profileImage = `/uploads/${encodeURI(path.basename(req.file.filename))}`;
    }

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'RESIDENT_VALIDATION_ERROR' });
    }

    const existingResident = await Resident.findOne({ userId: req.user.id });

    if (!residentData.email) {
        try {
            const user = await User.findById(req.user.id);
            if (user?.email) {
                residentData.email = user.email;
            }
        } catch {
            // Email fallback is best-effort; authenticated profile updates should not fail on it.
        }
    }

    if (!existingResident) {
        const missingFields = validateRequiredResidentFields(residentData);

        if (missingFields.length > 0) {
            throw createHttpError(400, `Missing required fields: ${missingFields.join(', ')}`, { code: 'RESIDENT_VALIDATION_ERROR' });
        }

        const createdResident = await Resident.create({
            userId: req.user.id,
            ...residentData
        });

        const populatedResident = await Resident.findById(createdResident._id)
            .populate('userId', 'username email role isActive createdAt');

        return res.status(201).json(serializeResident(populatedResident));
    }

    Object.assign(existingResident, residentData);
    await existingResident.save();

    const updatedResident = await Resident.findById(existingResident._id)
        .populate('userId', 'username email role isActive createdAt');

    res.json(serializeResident(updatedResident));
});

// UPDATE
exports.updateResident = asyncHandler(async (req, res) => {
    const residentData = pickResidentFields(req.body);
    const validationError = validateResidentData(residentData);

    if (validationError) {
        throw createHttpError(400, validationError, { code: 'RESIDENT_VALIDATION_ERROR' });
    }

    const updated = await Resident.findByIdAndUpdate(req.params.id, residentData, {
        returnDocument: 'after',
        runValidators: true
    }).populate('userId', 'username email role isActive accountStatus createdAt');

    if (!updated) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    res.json(serializeResident(updated));
});

// UPDATE ACCOUNT STATUS (ADMIN)
exports.updateResidentStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'suspended', 'archived', 'pending_approval'].includes(status)) {
        throw createHttpError(400, 'Status must be approved, rejected, suspended, archived, or pending_approval', { code: 'INVALID_STATUS' });
    }

    const resident = await Resident.findById(req.params.id);
    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    const user = await User.findById(resident.userId);
    if (!user) {
        throw createHttpError(404, 'Associated user account not found', { code: 'USER_NOT_FOUND' });
    }

    const verificationStatusByAccountStatus = {
        approved: 'verified',
        rejected: 'rejected',
        pending_approval: 'pending_review'
    };
    const nextVerificationStatus = verificationStatusByAccountStatus[status];

    user.accountStatus = status;
    user.isActive = status === 'approved' || status === 'pending_approval';
    await user.save();

    if (nextVerificationStatus) {
        resident.verificationStatus = nextVerificationStatus;
        if (status === 'approved' || status === 'rejected' || status === 'pending_approval') {
            resident.verificationRemarks = '';
        }
        await resident.save();
    }

    // Send email notification to user about approval or rejection
    if (user.email && resident.firstName) {
        const loginLink = `${getFrontendBaseUrl(req)}/?auth=login`;
        sendStatusUpdateEmail(user.email, resident.firstName, status, { loginLink });
    }

    // Send SMS notification to user about approval or rejection
    if (resident.contactNumber && resident.firstName) {
        sendStatusUpdateSMS(resident.contactNumber, resident.firstName, status);
    }

    res.json({
        message: `Resident account successfully ${status}`,
        resident: serializeResident(await Resident.findById(resident._id).populate('userId', 'username email role isActive accountStatus createdAt')),
        user: { id: user._id, accountStatus: user.accountStatus, isActive: user.isActive }
    });
});

exports.updateResidentVerification = asyncHandler(async (req, res) => {
    const { verificationStatus, verificationRemarks = '' } = req.body;
    const allowed = ['pending_review', 'under_verification', 'verified', 'rejected', 'needs_reupload'];
    if (!allowed.includes(verificationStatus)) {
        throw createHttpError(400, 'Invalid verificationStatus', { code: 'INVALID_VERIFICATION_STATUS' });
    }

    const resident = await Resident.findByIdAndUpdate(
        req.params.id,
        {
            verificationStatus,
            verificationRemarks: String(verificationRemarks || '').trim()
        },
        { returnDocument: 'after', runValidators: true }
    ).populate('userId', 'username email role isActive accountStatus createdAt');

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    res.json({
        message: 'Resident verification status updated',
        resident: serializeResident(resident)
    });
});

exports.sendResidentEmail = asyncHandler(async (req, res) => {
    const { subject, message } = req.body;
    const resident = await Resident.findById(req.params.id).populate('userId', 'email');

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }
    const toEmail = resident.email || resident.userId?.email;
    if (!toEmail) {
        throw createHttpError(400, 'Resident email not available', { code: 'RESIDENT_EMAIL_MISSING' });
    }

    const formattedSubject = String(subject || 'Barangay Resident Notification').trim();
    const body = String(message || '').trim() || 'This is a resident account notification from Barangay Administration.';
    await sendCustomResidentEmail(toEmail, resident.firstName || 'Resident', formattedSubject, body);
    res.json({
        message: 'Resident email sent successfully.',
        details: { toEmail, subject: formattedSubject, preview: body.slice(0, 120) }
    });
});

exports.sendResidentSMS = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    if (!resident.contactNumber) {
        throw createHttpError(400, 'Resident contact number not available', { code: 'RESIDENT_CONTACT_MISSING' });
    }

    const content = String(message || '').trim() || 'Your resident account has an update.';
    const prefixed = `Brgy Irawan: ${content}`;
    await sendSmsNotification({
        phoneNumber: resident.contactNumber,
        messageType: 'resident_update',
        messageContent: prefixed,
        recipientId: resident._id
    });

    res.json({
        message: 'Resident SMS sent successfully.',
        details: { phoneNumber: resident.contactNumber }
    });
});

exports.adminResetResidentPassword = asyncHandler(async (req, res) => {
    const resident = await Resident.findById(req.params.id).populate('userId', 'email');
    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    const user = await User.findById(resident.userId?._id || resident.userId);
    if (!user) {
        throw createHttpError(404, 'Associated user account not found', { code: 'USER_NOT_FOUND' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const baseUrl = String(process.env.APP_URL || process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const resetLink = `${baseUrl}/?resetToken=${resetToken}&email=${encodeURIComponent(user.email)}`;
    await sendPasswordResetEmail(user.email, resident.firstName || 'Resident', resetLink);

    res.json({
        message: 'Password reset link generated and sent to resident email.'
    });
});

// DELETE
exports.deleteResident = asyncHandler(async (req, res) => {
    const resident = await Resident.findById(req.params.id);

    if (!resident) {
        throw createHttpError(404, 'Resident profile not found', { code: 'RESIDENT_NOT_FOUND' });
    }

    const linkedUser = resident.userId ? await User.findById(resident.userId) : null;

    await resident.deleteOne();
    if (linkedUser) {
        await linkedUser.deleteOne();
    }

    res.json({ message: 'Resident account deleted successfully' });
});
