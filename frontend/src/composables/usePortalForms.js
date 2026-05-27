import { reactive, ref } from 'vue';
import { apiFetch } from '@/shared/client';

export function usePortalForms() {
    const submissionLock = ref(false);
    
    const reservationForm = reactive({ facilityName: 'barangay_hall', reservationDate: '', startTime: '', endTime: '', quantity: 0, purpose: '', reservationDetails: '' });
    const manpowerForm = reactive({
        assistanceType: 'event_security',
        title: '',
        description: '',
        requestLocation: '',
        requestDate: '',
        requestTime: '',
        estimatedDuration: '',
        requestedPersonnelCount: 1,
        priority: 'medium'
    });
    const reportForm = reactive({
        reportType: 'noise_complaint',
        description: '',
        locationText: '',
        locationLatitude: '',
        locationLongitude: '',
        locationAccuracy: '',
        incidentDate: '',
        priority: 'medium',
        contactPreference: 'in_app',
        isAnonymous: false
    });
    const reportProofFiles = ref([]);

    const resetForm = (target, resetValues) => {
        Object.keys(target).forEach((key) => {
            target[key] = resetValues[key] ?? (typeof target[key] === 'boolean' ? false : '');
        });
    };

    const submitForm = async (path, payload, successMessage, resetTarget, resetValues, reloader) => {
        if (submissionLock.value) {
            return { success: false, message: 'Please wait and try again.' };
        }

        submissionLock.value = true;

        try {
            const requestBody = payload instanceof FormData ? payload : JSON.stringify(payload);
            await apiFetch(path, { method: 'POST', body: requestBody });
            if (resetTarget && resetValues) {
                resetForm(resetTarget, resetValues);
            }
            if (reloader) {
                await reloader();
            }
            return { success: true, message: successMessage };
        } catch (error) {
            return { success: false, message: error.message, status: error.status, code: error.code };
        } finally {
            submissionLock.value = false;
        }
    };

    

    const submitReservation = async (loadReservations, loadFacilityAvailability) => {
        const selectedFacilityName = reservationForm.facilityName;
        const selectedReservationDate = reservationForm.reservationDate;
        const selectedStartTime = reservationForm.startTime;
        const selectedEndTime = reservationForm.endTime;

        // Prepare payload and map inventory quantity into the specific fields
        const normalizedQuantity = Number(reservationForm.quantity);
        const payload = {
            facilityName: reservationForm.facilityName,
            reservationDate: reservationForm.reservationDate,
            startTime: reservationForm.startTime,
            endTime: reservationForm.endTime,
            purpose: reservationForm.purpose,
            reservationDetails: reservationForm.reservationDetails
        };

        if (payload.facilityName === 'chair') {
            payload.chairQuantity = Number.isFinite(normalizedQuantity) ? normalizedQuantity : 0;
        } else if (payload.facilityName === 'tent') {
            payload.tentQuantity = Number.isFinite(normalizedQuantity) ? normalizedQuantity : 0;
        } else if (payload.facilityName === 'table') {
            payload.tableQuantity = Number.isFinite(normalizedQuantity) ? normalizedQuantity : 0;
        } else {
            payload.quantity = 0;
        }

        const result = await submitForm(
            '/facility-reservations',
            payload,
            'Facility reserved.',
            reservationForm,
            { facilityName: 'barangay_hall', reservationDate: '', startTime: '', endTime: '', quantity: 0, purpose: '', reservationDetails: '' },
            loadReservations
        );

        if (result.success && loadFacilityAvailability) {
            await loadFacilityAvailability(selectedFacilityName, selectedReservationDate, selectedStartTime, selectedEndTime);
        }

        return result;
    };

    const submitReport = async (loadReports) => submitForm(
        '/reports',
        (() => {
            const payload = new FormData();

            Object.entries(reportForm).forEach(([key, value]) => {
                payload.append(key, value === null || value === undefined ? '' : String(value));
            });

            reportProofFiles.value.forEach((file) => {
                payload.append('proofFiles', file);
            });

            return payload;
        })(),
        'Report submitted.',
        reportForm,
        {
            reportType: 'noise_complaint',
            description: '',
            locationText: '',
            locationLatitude: '',
            locationLongitude: '',
            locationAccuracy: '',
            incidentDate: '',
            priority: 'medium'
        },
        async () => {
            reportProofFiles.value = [];
            if (loadReports) {
                await loadReports();
            }
        }
    );

    const defaultManpowerForm = {
        assistanceType: 'event_security',
        title: '',
        description: '',
        requestLocation: '',
        requestDate: '',
        requestTime: '',
        estimatedDuration: '',
        requestedPersonnelCount: 1,
        priority: 'medium'
    };

    const submitManpowerRequest = async (loadManpowerRequests) => submitForm(
        '/manpower-requests',
        {
            ...manpowerForm,
            requestedPersonnelCount: Number(manpowerForm.requestedPersonnelCount)
        },
        'Manpower request submitted.',
        manpowerForm,
        defaultManpowerForm,
        loadManpowerRequests
    );

    return {
        reservationForm, manpowerForm, reportForm, reportProofFiles,
        submitReservation, submitManpowerRequest, submitReport
    };
}
