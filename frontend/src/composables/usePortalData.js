import { ref, reactive } from 'vue';
import { apiFetch, getAuth } from '@/shared/client';
import { formatFacilityInventorySummary } from '@/shared/facilityTimeSlots';

const isObjectId = (value) => /^[a-fA-F\d]{24}$/.test(String(value || '').trim());

export function usePortalData() {
    const statusMessage = ref('');
    const statusError = ref(false);
    
    const reservations = ref([]);
    const reports = ref([]);
    const manpowerRequests = ref([]);
    const disasterAdvisories = ref([]);
    const appointments = ref([]);
    const officials = ref([]);
    const facilityAvailability = ref('Pick a facility and date to load available slots.');
    const facilityAvailabilityDetails = ref(null);

    const profile = reactive({
        firstName: '', lastName: '', middleName: '', suffix: '', sex: 'male', birthDate: '', civilStatus: 'single',
        contactNumber: '', email: '', address: '', purok: '', houseNumber: '', streetAddress: '', citizenship: '', occupation: '', voterStatus: 'not_registered', householdMemberCount: 1, householdId: '', profileImage: '',
        medicalConditions: '', floodProneArea: false, evacuationPriority: '', verificationStatus: 'pending_review', verificationRemarks: '', validIdPath: '', selfieVerificationPath: ''
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

    const loadManpowerRequests = async () => {
        try {
            manpowerRequests.value = await apiFetch('/manpower-requests/me');
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

    const loadDisasterAdvisories = async () => {
        try {
            disasterAdvisories.value = await apiFetch('/disaster-advisories/public');
        } catch (error) {
            console.error('Failed to load disaster advisories', error);
        }
    };

    // loadDocuments is provided as a noop/compatibility hook for the portal
    // Document requests are handled by `useDocuments` composable directly
    const loadDocuments = async () => {
        try {
            // call the API to warm cache or validate session; ignore result here
            await apiFetch('/documents/my');
        } catch (error) {
            console.error('Failed to load documents (portal):', error);
        }
    };

    const loadAll = async () => {
        try {
            await Promise.all([
                loadProfile(),
                loadReservations(),
                loadReports(),
                loadManpowerRequests(),
                loadAppointments(),
                loadOfficials(),
                loadDisasterAdvisories()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            setStatus('Some data failed to load.', true);
        }
    };

    const saveProfile = async (bodyOverride = profile) => {
        try {
            await apiFetch('/residents/me', {
                method: 'PUT',
                body: bodyOverride instanceof FormData ? bodyOverride : JSON.stringify(bodyOverride)
            });
            setStatus('Resident profile saved.');
            await loadProfile();
        } catch (error) {
            setStatus(error.message, true);
        }
    };

    const loadFacilityAvailability = async (facilityName, reservationDate, startTime = '', endTime = '') => {
        if (!facilityName || !reservationDate) {
            facilityAvailability.value = 'Pick a facility and date to load available slots.';
            facilityAvailabilityDetails.value = null;
            return;
        }
        try {
            const query = new URLSearchParams({
                facilityName,
                date: reservationDate,
                ...(startTime ? { startTime } : {}),
                ...(endTime ? { endTime } : {})
            }).toString();
            const response = await apiFetch('/facility-reservations/availability?' + query);
            facilityAvailabilityDetails.value = response;
            const available = response.availableSlots?.length > 0 ? response.availableSlots.map((slot) => slot.startTime + '-' + slot.endTime).join(', ') : 'No open slots';
            const reserved = response.reservedSlots?.length > 0 ? response.reservedSlots.map((slot) => slot.startTime + '-' + slot.endTime + ' (' + slot.status + ')').join(', ') : 'None';
            facilityAvailability.value = 'Available: ' + available + '. Reserved: ' + reserved + '. ' + formatFacilityInventorySummary(response);
        } catch (error) {
            console.error('Failed to load facility availability:', error);
            facilityAvailability.value = 'Failed to load availability.';
            facilityAvailabilityDetails.value = null;
        }
    };

    return {
        statusMessage,
        statusError,
        
        reservations,
        reports,
        manpowerRequests,
        disasterAdvisories,
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
        loadManpowerRequests,
        loadAppointments,
        loadOfficials,
        loadDisasterAdvisories,
        loadAll,
        saveProfile,
        loadFacilityAvailability
    };
}
