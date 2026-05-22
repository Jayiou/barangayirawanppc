import { reactive, ref } from 'vue';
import { apiFetch } from '@/shared/client';

export function usePortalForms() {
    const submissionLock = ref(false);
    
    const reservationForm = reactive({ facilityName: 'barangay_hall', reservationDate: '', startTime: '', endTime: '', purpose: '', reservationDetails: '' });
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

    return {
        reservationForm, reportForm, reportProofFiles,
        submitReservation, submitReport
    };
}
