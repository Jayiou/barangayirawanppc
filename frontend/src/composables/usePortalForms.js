import { reactive, ref } from 'vue';
import { apiFetch } from '@/shared/client';

export function usePortalForms() {
    const appointmentForm = reactive({ officialId: '', appointmentDate: '', timeSlot: '', purpose: '', concernDetails: '' });
    const documentForm = reactive({ documentType: 'barangay_clearance', purpose: '', requestDetails: '' });
    const reservationForm = reactive({ facilityName: 'barangay_hall', reservationDate: '', startTime: '', endTime: '', purpose: '', reservationDetails: '' });
    const reportForm = reactive({ reportType: 'noise_complaint', title: '', description: '', locationText: '', incidentDate: '', priority: 'medium', contactPreference: 'in_app', isAnonymous: false });

    const resetForm = (target, resetValues) => {
        Object.keys(target).forEach((key) => {
            target[key] = resetValues[key] ?? (typeof target[key] === 'boolean' ? false : '');
        });
    };

    const submitForm = async (path, payload, successMessage, resetTarget, resetValues, reloader) => {
        try {
            await apiFetch(path, { method: 'POST', body: JSON.stringify(payload) });
            if (resetTarget && resetValues) {
                resetForm(resetTarget, resetValues);
            }
            if (reloader) {
                await reloader();
            }
            return { success: true, message: successMessage };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const submitAppointment = async (loadAppointments) => submitForm(
        '/appointments',
        appointmentForm,
        'Appointment booked.',
        appointmentForm,
        { officialId: '', appointmentDate: '', timeSlot: '', purpose: '', concernDetails: '' },
        loadAppointments
    );

    const submitDocumentRequest = async (loadDocuments) => submitForm(
        '/document-requests',
        documentForm,
        'Document requested.',
        documentForm,
        { documentType: 'barangay_clearance', purpose: '', requestDetails: '' },
        loadDocuments
    );

    const submitReservation = async (loadReservations, loadFacilityAvailability) => {
        const result = await submitForm(
            '/facility-reservations',
            reservationForm,
            'Facility reserved.',
            reservationForm,
            { facilityName: 'barangay_hall', reservationDate: '', startTime: '', endTime: '', purpose: '', reservationDetails: '' },
            loadReservations
        );
        if (result.success && loadFacilityAvailability) {
            await loadFacilityAvailability(reservationForm.facilityName, reservationForm.reservationDate);
        }
        return result;
    };

    const submitReport = async (loadReports) => submitForm(
        '/reports',
        reportForm,
        'Report submitted.',
        reportForm,
        { reportType: 'noise_complaint', title: '', description: '', locationText: '', incidentDate: '', priority: 'medium', contactPreference: 'in_app', isAnonymous: false },
        loadReports
    );

    return {
        appointmentForm, documentForm, reservationForm, reportForm,
        submitAppointment, submitDocumentRequest, submitReservation, submitReport
    };
}
