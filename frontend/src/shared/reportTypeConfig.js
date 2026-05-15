export const REPORT_TYPE_CONFIG = {
    noise_complaint: {
        label: 'Noise Complaint',
        titlePlaceholder: 'Ex: Late-night karaoke complaint',
        descriptionPlaceholder: 'Describe when, where, and how often the noise happens.',
        locationHint: 'Nearest street, purok, and house landmark',
        requireIncidentDate: true,
        requireProof: true,
        proofLabel: 'Proof (photo evidence)'
    },
    disturbance: {
        label: 'Disturbance',
        titlePlaceholder: 'Ex: Public altercation at night',
        descriptionPlaceholder: 'Describe the disturbance and who is affected.',
        locationHint: 'Exact spot where disturbance happened',
        requireIncidentDate: false,
        requireProof: false,
        proofLabel: 'Supporting photos'
    },
    sanitation: {
        label: 'Sanitation',
        titlePlaceholder: 'Ex: Uncollected garbage pile',
        descriptionPlaceholder: 'Describe the sanitation issue and urgency.',
        locationHint: 'Pinpoint where cleanup is needed',
        requireIncidentDate: false,
        requireProof: false,
        proofLabel: 'Supporting photos'
    },
    infrastructure: {
        label: 'Infrastructure',
        titlePlaceholder: 'Ex: Broken drainage cover',
        descriptionPlaceholder: 'Describe damage, hazard level, and traffic impact.',
        locationHint: 'Street corner or nearest structure',
        requireIncidentDate: false,
        requireProof: false,
        proofLabel: 'Supporting photos'
    },
    public_safety: {
        label: 'Public Safety',
        titlePlaceholder: 'Ex: No streetlight in dark alley',
        descriptionPlaceholder: 'Describe the safety risk and people affected.',
        locationHint: 'Specific public area or route',
        requireIncidentDate: false,
        requireProof: false,
        proofLabel: 'Supporting photos'
    },
    animal_related: {
        label: 'Animal Related',
        titlePlaceholder: 'Ex: Stray dog causing accidents',
        descriptionPlaceholder: 'Describe the animal issue and observed behavior.',
        locationHint: 'Where the animal issue usually occurs',
        requireIncidentDate: false,
        requireProof: false,
        proofLabel: 'Supporting photos'
    },
    disaster: {
        label: 'Disaster',
        titlePlaceholder: 'Ex: Flooded road section',
        descriptionPlaceholder: 'Describe current disaster condition and immediate need.',
        locationHint: 'Affected zone or evacuation area',
        requireIncidentDate: false,
        requireProof: false,
        proofLabel: 'Supporting photos'
    },
    other: {
        label: 'Other',
        titlePlaceholder: 'Ex: Community concern',
        descriptionPlaceholder: 'Describe the concern clearly and completely.',
        locationHint: 'Relevant location of concern',
        requireIncidentDate: false,
        requireProof: false,
        proofLabel: 'Supporting photos'
    }
};

export const REPORT_TYPE_OPTIONS = Object.entries(REPORT_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label
}));
