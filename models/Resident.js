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
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Resident', residentSchema);
