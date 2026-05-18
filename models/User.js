const mongoose = require('../config/mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'resident'],
            default: 'resident'
        },
        accountStatus: {
            type: String,
            enum: ['pending_otp', 'pending_approval', 'approved', 'rejected', 'suspended', 'archived'],
            default: 'pending_otp'
        },
        otpCode: {
            type: String
        },
        otpExpires: {
            type: Date
        },
        pendingResidentProfile: {
            firstName: {
                type: String,
                trim: true
            },
            middleName: {
                type: String,
                trim: true,
                default: ''
            },
            lastName: {
                type: String,
                trim: true
            },
            suffix: {
                type: String,
                trim: true,
                default: ''
            },
            sex: {
                type: String,
                trim: true
            },
            birthDate: {
                type: Date
            },
            civilStatus: {
                type: String,
                trim: true,
                default: 'single'
            },
            contactNumber: {
                type: String,
                trim: true
            },
            address: {
                type: String,
                trim: true
            },
            purok: {
                type: String,
                trim: true
            },
            zone: {
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
                trim: true,
                default: 'not_registered'
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
            vulnerabilityType: {
                type: String,
                trim: true,
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
            floodProneArea: {
                type: Boolean,
                default: false
            },
            proofOfResidency: {
                type: String,
                trim: true
            }
        },
        isActive: {
            type: Boolean,
            default: true
        },
        failedLoginAttempts: {
            type: Number,
            default: 0
        },
        lastFailedLoginAt: {
            type: Date
        },
        lockedUntil: {
            type: Date
        },
        passwordResetToken: {
            type: String
        },
        passwordResetExpires: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);
