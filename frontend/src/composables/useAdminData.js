import { ref } from 'vue';
import { apiFetch } from '@/shared/client';

export function useAdminData() {
    const residents = ref([]);
    const documentRequests = ref([]);
    const reservations = ref([]);
    const reports = ref([]);
    const announcements = ref([]);
    const appointments = ref([]);
    const officials = ref([]);

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
                apiFetch('/residents'),
                apiFetch('/document-requests'),
                apiFetch('/facility-reservations'),
                apiFetch('/reports'),
                apiFetch('/announcements/admin/all').then(res => res.data || res),
                apiFetch('/appointments/admin/all-appointments').then(res => res.data || res),
                apiFetch('/appointments/officials').then(res => res.data || res)
            ]);

            [
                residents.value, 
                documentRequests.value, 
                reservations.value, 
                reports.value, 
                announcements.value,
                appointments.value,
                officials.value
            ] = results;
            msg('Dashboard ready.', false);
        } catch (error) {
            msg('Failed to load data. Please try again.', true);
            console.error('Data loading error:', error);
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
        dashboardStatus,
        dashboardError,
        msg,
        loadAll
    };
}
