export const APPOINTMENT_CATEGORY_OPTIONS = Object.freeze([
    { value: 'Document Requests', label: 'Document Requests', positions: ['Barangay Secretary'] },
    { value: 'Financial Concerns', label: 'Financial Concerns', positions: ['Barangay Treasurer'] },
    { value: 'Complaints and Disputes', label: 'Complaints and Disputes', positions: ['Barangay Captain'] },
    { value: 'Community Programs and Projects', label: 'Community Programs and Projects', positions: ['Barangay Kagawad'] },
    { value: 'General Inquiries', label: 'General Inquiries', positions: null }
]);

export const filterOfficialsByAppointmentCategory = (officials = [], category = '') => {
    const selectedCategory = APPOINTMENT_CATEGORY_OPTIONS.find((option) => option.value === category);
    if (!selectedCategory) return [];
    if (selectedCategory.positions === null) return officials;
    return officials.filter((official) => selectedCategory.positions.includes(official.position));
};

export const getMinimumAppointmentDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
    ].join('-');
};
