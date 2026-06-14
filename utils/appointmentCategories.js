const APPOINTMENT_CATEGORY_POSITIONS = Object.freeze({
    'Document Requests': ['Barangay Secretary'],
    'Financial Concerns': ['Barangay Treasurer'],
    'Complaints and Disputes': ['Barangay Captain'],
    'Community Programs and Projects': ['Barangay Kagawad'],
    'General Inquiries': null
});

const APPOINTMENT_CATEGORIES = Object.freeze(Object.keys(APPOINTMENT_CATEGORY_POSITIONS));

const isValidAppointmentCategory = (category) => APPOINTMENT_CATEGORIES.includes(category);

const isOfficialAppropriateForCategory = (official, category) => {
    const positions = APPOINTMENT_CATEGORY_POSITIONS[category];
    return positions === null || Boolean(positions?.includes(official?.position));
};

module.exports = {
    APPOINTMENT_CATEGORIES,
    APPOINTMENT_CATEGORY_POSITIONS,
    isValidAppointmentCategory,
    isOfficialAppropriateForCategory
};
