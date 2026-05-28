const mongoose = require('../config/mongoose');

const ACTIVE_SLOT_STATUSES = ['pending', 'approved', 'completed'];

const formatDateKey = (date) => {
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) {
        return '';
    }

    return (
        value.getFullYear() +
        '-' +
        String(value.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(value.getDate()).padStart(2, '0')
    );
};

const buildAppointmentSlotKey = (appointment) => {
    if (
        !appointment.officialId ||
        !appointment.appointmentDate ||
        !appointment.timeSlot?.startTime ||
        !appointment.timeSlot?.endTime
    ) {
        return undefined;
    }

    return [
        appointment.officialId.toString(),
        formatDateKey(appointment.appointmentDate),
        appointment.timeSlot.startTime,
        appointment.timeSlot.endTime
    ].join('|');
};

const appointmentSchema = new mongoose.Schema(
    {
        residentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resident',
            default: null,
            required() {
                return this.requesterType !== 'guest';
            }
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            required() {
                return this.requesterType !== 'guest';
            }
        },
        requesterType: {
            type: String,
            enum: ['resident', 'guest'],
            default: 'resident'
        },
        firstName: {
            type: String,
            trim: true,
            default: ''
        },
        middleName: {
            type: String,
            trim: true,
            default: ''
        },
        lastName: {
            type: String,
            trim: true,
            default: ''
        },
        suffix: {
            type: String,
            trim: true,
            default: ''
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
            trim: true,
            default: ''
        },
        officialId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Official',
            required: true
        },
        appointmentDate: {
            type: Date,
            required: true
        },
        timeSlot: {
            startTime: {
                type: String,
                required: true // HH:mm format (e.g., "09:00")
            },
            endTime: {
                type: String,
                required: true // HH:mm format (e.g., "10:00")
            }
        },
        purpose: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'expired'],
            default: 'pending'
        },
        slotKey: {
            type: String,
            trim: true,
            select: false
        },
        remarks: {
            type: String,
            trim: true,
            default: ''
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: ''
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: ''
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        approvedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
            type: Date,
            default: null
        },
        cancelledAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        expiredAt: {
            type: Date,
            default: null
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

appointmentSchema.pre('validate', function setSlotKey() {
    if (ACTIVE_SLOT_STATUSES.includes(this.status)) {
        this.slotKey = buildAppointmentSlotKey(this);
    } else {
        this.slotKey = undefined;
    }
});

// Index for finding resident's active appointments
appointmentSchema.index({ residentId: 1, status: 1 });
appointmentSchema.index({ officialId: 1, appointmentDate: 1, 'timeSlot.startTime': 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ createdAt: 1 });
appointmentSchema.index(
    { slotKey: 1 },
    {
        unique: true,
        sparse: true,
        name: 'unique_active_appointment_slot'
    }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.buildAppointmentSlotKey = buildAppointmentSlotKey;
module.exports.ACTIVE_SLOT_STATUSES = ACTIVE_SLOT_STATUSES;
