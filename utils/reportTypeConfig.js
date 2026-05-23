const REPORT_TYPE_RULES = {
    noise_complaint: {
        label: 'Noise Complaint',
        requireIncidentDate: true,
        requireProofForResident: true
    },
    disturbance: {
        label: 'Disturbance',
        requireIncidentDate: true,
        requireProofForResident: true
    },
    sanitation: {
        label: 'Sanitation',
        requireIncidentDate: true,
        requireProofForResident: true
    },
    infrastructure: {
        label: 'Infrastructure',
        requireIncidentDate: true,
        requireProofForResident: true
    },
    public_safety: {
        label: 'Public Safety',
        requireIncidentDate: true,
        requireProofForResident: true
    },
    animal_related: {
        label: 'Animal Related',
        requireIncidentDate: true,
        requireProofForResident: true
    },
    disaster: {
        label: 'Disaster',
        requireIncidentDate: false,
        requireProofForResident: false
    },
    other: {
        label: 'Other',
        requireIncidentDate: false,
        requireProofForResident: false
    }
};

const getReportTypeRule = (type) => REPORT_TYPE_RULES[type] || null;

module.exports = {
    REPORT_TYPE_RULES,
    getReportTypeRule
};
