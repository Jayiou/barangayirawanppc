import { ref, reactive } from 'vue';
import { apiFetch } from '@/shared/client';

export function useStatusCRUD(resourceType) {
    const items = ref([]);
    const editForm = reactive({ status: '', adminNotes: '' });

    const pathMap = {
        document: '/document-requests',
        appointment: '/appointments',
        reservation: '/facility-reservations',
        report: '/reports'
    };

    const basePath = pathMap[resourceType];

    if (!basePath) {
        throw new Error(`Unknown resource type: ${resourceType}`);
    }

    const updateStatus = async (itemId, status, adminNotes = '') => {
        try {
            await apiFetch(`${basePath}/${itemId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status, adminNotes })
            });
        } catch (error) {
            throw new Error(error.message || 'Failed to update status');
        }
    };

    const loadItems = async () => {
        try {
            items.value = await apiFetch(basePath);
        } catch (error) {
            console.error(`Failed to load ${resourceType}:`, error);
        }
    };

    const deleteItem = async (itemId) => {
        try {
            await apiFetch(`${basePath}/${itemId}`, { method: 'DELETE' });
            await loadItems();
        } catch (error) {
            throw new Error(error.message || `Failed to delete ${resourceType}`);
        }
    };

    return {
        items,
        editForm,
        updateStatus,
        loadItems,
        deleteItem
    };
}
