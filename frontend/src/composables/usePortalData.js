import { ref, reactive } from 'vue';
import { apiFetch, getAuth } from '@/shared/client';

const isObjectId = (value) => /^[a-fA-F\d]{24}$/.test(String(value || '').trim());

export function usePortalData() {
    const statusMessage = ref('Checking your session.');
    const statusError = ref(false);
    const documentRequests = ref([]);
    const reservations = ref([]);
    const reports = ref([]);
    const appointments = ref([]);
    const officials = ref([]);
    const facilityAvailability = ref('Pick a facility and date to load available slots.');
    const facilityAvailabilityDetails = ref(null);

    const profile = reactive({
        firstName: '', lastName: '', middleName: '', suffix: '', sex: 'male', birthDate: '', civilStatus: 'single',
        contactNumber: '', email: '', address: '', purok: '', citizenship: '', occupation: '', voterStatus: 'not_registered', profileImage: ''
    });

    const setStatus = (message, isError = false) => {
        statusMessage.value = message;
        statusError.value = isError;
    };

    const applyValues = (source, values) => {
        Object.keys(source).forEach((key) => {
            source[key] = values[key] ?? (typeof source[key] === 'boolean' ? false : '');
        });
    };

    const loadProfile = async () => {
        const auth = getAuth();
        try {
            const data = await apiFetch('/residents/me');
            applyValues(profile, { ...profile, ...data, birthDate: data.birthDate ? String(data.birthDate).slice(0, 10) : '' });
            if (!profile.email && auth.user?.email) {
                profile.email = auth.user.email;
            }
        } catch (error) {
            if (auth.user?.email) {
                profile.email = auth.user.email;
            }
            setStatus(error.message, true);
        }
    };


    const loadDocuments = async () => { 
        try {
            documentRequests.value = await apiFetch('/document-requests/me');
        } catch (error) {
            setStatus(error.message, true);
        }
    };

    const loadReservations = async () => { 
        try {
            reservations.value = await apiFetch('/facility-reservations/me');
        } catch (error) {
            setStatus(error.message, true);
        }
    };

    const loadReports = async () => { 
        try {
            reports.value = await apiFetch('/reports/me');
        } catch (error) {
            setStatus(error.message, true);
        }
    };

    const loadAppointments = async () => { 
        try {
            const data = await apiFetch('/appointments/my-appointments');
            appointments.value = data.data || data || [];
        } catch (error) {
            console.error('Failed to load appointments', error);
        }
    };

    const loadOfficials = async () => {
        try {
            const data = await apiFetch('/appointments/officials');
            officials.value = data.data || data || [];
        } catch (error) {
            console.error('Failed to load officials', error);
        }
    };

    const loadAll = async () => {
        try {
            await Promise.all([
                loadProfile(),
                loadDocuments(),
                loadReservations(),
                loadReports(),
                loadAppointments(),
                loadOfficials()
            ]);
            setStatus('Dashboard loaded.');
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setStatus('Some data failed to load.', true);
        }
    };

    const saveProfile = async () => {
        try {
            await apiFetch('/residents/me', { method: 'PUT', body: JSON.stringify(profile) });
            setStatus('Resident profile saved.');
            await loadProfile();
        } catch (error) {
            setStatus(error.message, true);
        }
    };

    const loadFacilityAvailability = async (facilityName, reservationDate) => {
        if (!facilityName || !reservationDate) {
            facilityAvailability.value = 'Pick a facility and date to load available slots.';
            facilityAvailabilityDetails.value = null;
            return;
        }
        try {
            const query = new URLSearchParams({ facilityName, date: reservationDate }).toString();
            const response = await apiFetch('/facility-reservations/availability?' + query);
            facilityAvailabilityDetails.value = response;
            const available = response.availableSlots?.length > 0 ? response.availableSlots.map((slot) => slot.startTime + '-' + slot.endTime).join(', ') : 'No open slots';
            const reserved = response.reservedSlots?.length > 0 ? response.reservedSlots.map((slot) => slot.startTime + '-' + slot.endTime + ' (' + slot.status + ')').join(', ') : 'None';
            facilityAvailability.value = 'Available: ' + available + '. Reserved: ' + reserved;
        } catch (error) {
            console.error('Failed to load facility availability:', error);
            facilityAvailability.value = 'Failed to load availability.';
            facilityAvailabilityDetails.value = null;
        }
    };

    return {
        statusMessage,
        statusError,
        documentRequests,
        reservations,
        reports,
        appointments,
        officials,
        facilityAvailability,
        facilityAvailabilityDetails,
        profile,
        setStatus,
        applyValues,
        loadProfile,
        loadDocuments,
        loadReservations,
        loadReports,
        loadAppointments,
        loadOfficials,
        loadAll,
        saveProfile,
        loadFacilityAvailability
    };
}
