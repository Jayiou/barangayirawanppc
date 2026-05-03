<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import RecordList from '@/components/RecordList.vue';

const sidebarOpen = ref(false);
const activeModal = ref(null);
import { apiFetch, clearAuth, formatDate, getAuth } from '@/shared/client';

const currentView = ref('profile');
const statusMessage = ref('Checking your session.');
const statusError = ref(false);
const user = ref(null);
const officials = ref([]);
const appointments = ref([]);
const documentRequests = ref([]);
const reservations = ref([]);
const reports = ref([]);
const facilityAvailability = ref('Pick a facility and date to load available slots.');

const profile = reactive({
    firstName: '', lastName: '', middleName: '', suffix: '', sex: 'male', birthDate: '', civilStatus: 'single',
    contactNumber: '', email: '', address: '', purok: '', citizenship: '', occupation: '', voterStatus: 'not_registered', profileImage: ''
});
const appointmentForm = reactive({ officialId: '', appointmentDate: '', timeSlot: '', purpose: '', concernDetails: '' });
const documentForm = reactive({ documentType: 'barangay_clearance', purpose: '', requestDetails: '' });
const reservationForm = reactive({ facilityName: 'barangay_hall', reservationDate: '', startTime: '', endTime: '', purpose: '', reservationDetails: '' });
const reportForm = reactive({ reportType: 'noise_complaint', title: '', description: '', locationText: '', incidentDate: '', priority: 'medium', contactPreference: 'in_app', isAnonymous: false });

const viewTitle = computed(() => ({
    profile: 'Manage your personal information',
    documents: 'Request and track barangay documents',
    appointments: 'Book and manage your appointments',
    reservations: 'Reserve facilities for events',
    reports: 'Submit and monitor your reports'
}[currentView.value]));

const officialItems = computed(() => officials.value.map((item) => ({
    id: item._id,
    title: item.fullName,
    status: item.availabilityStatus,
    meta: item.position + ' | ' + (item.officeLocation || 'No office location')
})));
const appointmentItems = computed(() => appointments.value.map((item) => ({
    id: item._id,
    title: item.purpose,
    status: item.status,
    meta: formatDate(item.appointmentDate) + ' | ' + item.timeSlot + ' | Official: ' + (item.officialId?.fullName || item.officialId)
})));
const documentItems = computed(() => documentRequests.value.map((item) => ({
    id: item._id,
    title: item.documentType,
    status: item.status,
    meta: item.purpose + (item.adminNotes ? ' | Notes: ' + item.adminNotes : '')
})));
const reservationItems = computed(() => reservations.value.map((item) => ({
    id: item._id,
    title: item.facilityName,
    status: item.status,
    meta: formatDate(item.reservationDate) + ' | ' + item.startTime + '-' + item.endTime + ' | ' + item.purpose
})));
const reportItems = computed(() => reports.value.map((item) => ({
    id: item._id,
    title: item.title,
    status: item.status,
    meta: item.reportType + ' | ' + item.priority + ' | ' + item.locationText
})));

const setStatus = (message, isError = false) => {
    statusMessage.value = message;
    statusError.value = isError;
};

const applyValues = (source, values) => {
    Object.keys(source).forEach((key) => {
        source[key] = values[key] ?? (typeof source[key] === 'boolean' ? false : '');
    });
};

const ensureResident = async () => {
    const auth = getAuth();
    if (!auth.token) {
        window.location.href = '/';
        return false;
    }
    try {
        const me = await apiFetch('/auth/me');
        if (me.role !== 'resident') {
            window.location.href = '/admin';
            return false;
        }
        user.value = me;
        return true;
    } catch {
        clearAuth();
        window.location.href = '/';
        return false;
    }
};

const loadProfile = async () => {
    try {
        const data = await apiFetch('/residents/me');
        applyValues(profile, { ...profile, ...data, birthDate: data.birthDate ? String(data.birthDate).slice(0, 10) : '' });
    } catch (error) {
        setStatus(error.message, true);
    }
};

const loadOfficials = async () => { officials.value = await apiFetch('/officials'); };
const loadAppointments = async () => { appointments.value = await apiFetch('/appointments/me'); };
const loadDocuments = async () => { documentRequests.value = await apiFetch('/document-requests/me'); };
const loadReservations = async () => { reservations.value = await apiFetch('/facility-reservations/me'); };
const loadReports = async () => { reports.value = await apiFetch('/reports/me'); };

const saveProfile = async () => {
    try {
        await apiFetch('/residents/me', { method: 'PUT', body: JSON.stringify(profile) });
        setStatus('Resident profile saved.');
        await loadProfile();
    } catch (error) {
        setStatus(error.message, true);
    }
};

const submitAndRefresh = async (path, payload, successMessage, resetTarget, resetValues, reloader) => {
    try {
        await apiFetch(path, { method: 'POST', body: JSON.stringify(payload) });
        setStatus(successMessage);
        applyValues(resetTarget, resetValues);
        activeModal.value = null;
        await reloader();
    } catch (error) {
        setStatus(error.message, true);
    }
};

const submitAppointment = () => submitAndRefresh(
    '/appointments',
    appointmentForm,
    'Appointment booked.',
    appointmentForm,
    { officialId: '', appointmentDate: '', timeSlot: '', purpose: '', concernDetails: '' },
    loadAppointments
);

const submitDocumentRequest = () => submitAndRefresh(
    '/document-requests',
    documentForm,
    'Document requested.',
    documentForm,
    { documentType: 'barangay_clearance', purpose: '', requestDetails: '' },
    loadDocuments
);

const submitReservation = async () => {
    await submitAndRefresh(
        '/facility-reservations',
        reservationForm,
        'Facility reserved.',
        reservationForm,
        { facilityName: 'barangay_hall', reservationDate: '', startTime: '', endTime: '', purpose: '', reservationDetails: '' },
        loadReservations
    );
    await loadFacilityAvailability();
};

const submitReport = () => submitAndRefresh(
    '/reports',
    reportForm,
    'Report submitted.',
    reportForm,
    { reportType: 'noise_complaint', title: '', description: '', locationText: '', incidentDate: '', priority: 'medium', contactPreference: 'in_app', isAnonymous: false },
    loadReports
);

const loadFacilityAvailability = async () => {
    if (!reservationForm.facilityName || !reservationForm.reservationDate) {
        facilityAvailability.value = 'Pick a facility and date to load available slots.';
        return;
    }
    try {
        const query = new URLSearchParams({ facilityName: reservationForm.facilityName, date: reservationForm.reservationDate }).toString();
        const response = await apiFetch('/facility-reservations/availability?' + query);
        const available = response.availableSlots.length > 0 ? response.availableSlots.map((slot) => slot.startTime + '-' + slot.endTime).join(', ') : 'No open slots';
        const reserved = response.reservedSlots.length > 0 ? response.reservedSlots.map((slot) => slot.startTime + '-' + slot.endTime + ' (' + slot.status + ')').join(', ') : 'None';
        facilityAvailability.value = 'Available: ' + available + '. Reserved: ' + reserved;
    } catch (error) {
        facilityAvailability.value = 'Failed to load availability.';
    }
};

const logout = () => {
    clearAuth();
    window.location.href = '/';
};

onMounted(async () => {
    const allowed = await ensureResident();
    if (!allowed) return;
    try {
        await Promise.all([
            loadProfile(),
            loadOfficials(),
            loadAppointments(),
            loadDocuments(),
            loadReservations(),
            loadReports()
        ]);
        setStatus('Dashboard loaded.');
    } catch (error) {
        setStatus('Some data failed to load.', true);
    }
});
</script>