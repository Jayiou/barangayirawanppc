const REPORT_TYPE_RULES = {
    noise_complaint: {
        label: 'Noise Complaint',
        requireIncidentDate: true,
        requireProofForResident: true
    },
    disturbance: {
        label: 'Disturbance',
        requireIncidentDate: false,
        requireProofForResident: false
    },
    sanitation: {
        label: 'Sanitation',
        requireIncidentDate: false,
        requireProofForResident: false
    },
    infrastructure: {
        label: 'Infrastructure',
        requireIncidentDate: false,
        requireProofForResident: false
    },
    public_safety: {
        label: 'Public Safety',
        requireIncidentDate: false,
        requireProofForResident: false
    },
    animal_related: {
        label: 'Animal Related',
        requireIncidentDate: false,
        requireProofForResident: false
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
