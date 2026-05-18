const mongoose = require('../config/mongoose');

const residentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        middleName: {
            type: String,
            trim: true,
            default: ''
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        suffix: {
            type: String,
            trim: true,
            default: ''
        },
        sex: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true
        },
        birthDate: {
            type: Date,
            required: true
        },
        civilStatus: {
            type: String,
            enum: ['single', 'married', 'widowed', 'separated'],
            default: 'single'
        },
        contactNumber: {
            type: String,
            trim: true,
            default: ''
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ''
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        purok: {
            type: String,
            trim: true,
            default: ''
        },
        zone: {
            type: String,
            trim: true,
            default: ''
        },
        houseNumber: {
            type: String,
            trim: true,
            default: ''
        },
        streetAddress: {
            type: String,
            trim: true,
            default: ''
        },
        citizenship: {
            type: String,
            trim: true,
            default: 'Filipino'
        },
        occupation: {
            type: String,
            trim: true,
            default: ''
        },
        voterStatus: {
            type: String,
            enum: ['registered', 'not_registered'],
            default: 'not_registered'
        },
        profileImage: {
            type: String,
            trim: true,
            default: ''
        },
        proofOfResidency: {
            type: String,
            required: true,
            trim: true
        },
        isSeniorCitizen: {
            type: Boolean,
            default: false
        },
        isPWD: {
            type: Boolean,
            default: false
        },
        isSoloParent: {
            type: Boolean,
            default: false
        },
        isPregnant: {
            type: Boolean,
            default: false
        },
        householdMemberCount: {
            type: Number,
            min: 1,
            default: 1
        },
        householdId: {
            type: String,
            trim: true,
            default: ''
        },
        vulnerabilityType: {
            type: String,
            enum: ['', 'senior', 'pwd', 'both'],
            default: ''
        },
        vulnerabilityProofPath: {
            type: String,
            trim: true,
            default: ''
        },
        verificationPending: {
            type: Boolean,
            default: false
        },
        emergencyContactName: {
            type: String,
            trim: true,
            default: ''
        },
        emergencyContactNumber: {
            type: String,
            trim: true,
            default: ''
        },
        emergencyContactRelationship: {
            type: String,
            trim: true,
            default: ''
        },
        medicalConditions: {
            type: String,
            trim: true,
            default: ''
        },
        floodProneArea: {
            type: Boolean,
            default: false
        },
        evacuationPriority: {
            type: String,
            enum: ['', 'low', 'medium', 'high', 'critical'],
            default: ''
        },
        verificationStatus: {
            type: String,
            enum: ['pending_review', 'under_verification', 'verified', 'rejected', 'needs_reupload'],
            default: 'pending_review'
        },
        verificationRemarks: {
            type: String,
            trim: true,
            default: ''
        },
        validIdPath: {
            type: String,
            trim: true,
            default: ''
        },
        selfieVerificationPath: {
            type: String,
            trim: true,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Resident', residentSchema);
