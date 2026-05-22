import { ref } from 'vue';
import { apiFetch, getAuth } from '@/shared/client';

export function useAdminData() {
    const residents = ref([]);
    const documentRequests = ref([]);
    const reservations = ref([]);
    const reports = ref([]);
    const announcements = ref([]);
    const appointments = ref([]);
    const officials = ref([]);
    const disasterIncidents = ref([]);

    const dashboardStatus = ref('Loading portal...');
    const dashboardError = ref(false);

    const isDataLoading = ref(true);

    const msg = (txt, isError = false) => {
        dashboardStatus.value = txt;
        dashboardError.value = isError;
    };

    const loadAll = async () => {
        try {
            isDataLoading.value = true;
            msg('Loading portal data...', false);

            // Avoid calling admin-only endpoints when there is no auth token
            const auth = getAuth();
            const calls = [
                apiFetch('/residents'),
                apiFetch('/facility-reservations'),
                apiFetch('/reports'),
                apiFetch('/announcements/admin/all').then(res => res.data || res),
                apiFetch('/appointments/admin/all-appointments').then(res => res.data || res),
                apiFetch('/appointments/officials').then(res => res.data || res),
                apiFetch('/disaster-advisories')
            ];

            if (auth.token) {
                // insert admin documents call as second item to preserve previous ordering
                calls.splice(1, 0, apiFetch('/admin/documents'));
            } else {
                // keep a placeholder so we can assign consistently later
                calls.splice(1, 0, Promise.resolve([]));
            }

            const results = await Promise.all(calls);

            // normalize each result to a sensible default (array or single value)
            const normalize = (r) => (r && (r.data || r)) || [];

            residents.value = normalize(results[0]);
            documentRequests.value = normalize(results[1]);
            reservations.value = normalize(results[2]);
            reports.value = normalize(results[3]);
            announcements.value = normalize(results[4]);
            appointments.value = normalize(results[5]);
            officials.value = normalize(results[6]);
            disasterIncidents.value = normalize(results[7]);
            isDataLoading.value = false;
            msg('Dashboard ready.', false);
        } catch (error) {
            isDataLoading.value = false;
            msg('Failed to load data. Please try again.', true);
            console.error('Data loading error:', error);
        }
    };

    const loadDocuments = async () => {
        try {
            const data = await apiFetch('/admin/documents');
            documentRequests.value = data.data || data || [];
        } catch (err) {
            console.error('Failed to load admin documents', err);
            documentRequests.value = [];
        }
    };

    return {
        residents,
        documentRequests,
        reservations,
        reports,
        announcements,
        appointments,
        officials,
        disasterIncidents,
        dashboardStatus,
        dashboardError,
        isDataLoading,
        msg,
        loadAll
    };
}
