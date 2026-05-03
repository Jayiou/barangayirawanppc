import { ref } from 'vue';
import { apiFetch } from '@/shared/client';

export function useAdminData() {
    const officials = ref([]);
    const residents = ref([]);
    const appointments = ref([]);
    const documentRequests = ref([]);
    const reservations = ref([]);
    const reports = ref([]);
    const announcements = ref([]);

    const dashboardStatus = ref('Loading portal...');
    const dashboardError = ref(false);

    const msg = (txt, isError = false) => {
        dashboardStatus.value = txt;
        dashboardError.value = isError;
    };

    const loadAll = async () => {
        try {
            msg('Loading portal data...', false);
            const results = await Promise.all([
                apiFetch('/officials'),
                apiFetch('/residents'),
                apiFetch('/appointments'),
                apiFetch('/document-requests'),
                apiFetch('/facility-reservations'),
                apiFetch('/reports'),
                apiFetch('/announcements/admin/all').then(res => res.data || res)
            ]);

            [officials.value, residents.value, appointments.value, documentRequests.value, reservations.value, reports.value, announcements.value] = results;
            msg('Dashboard ready.', false);
        } catch (error) {
            msg('Failed to load data. Please try again.', true);
            console.error('Data loading error:', error);
        }
    };

    return {
        officials,
        residents,
        appointments,
        documentRequests,
        reservations,
        reports,
        announcements,
        dashboardStatus,
        dashboardError,
        msg,
        loadAll
    };
}
