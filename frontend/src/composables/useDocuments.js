import { ref } from 'vue';
import { apiFetch } from '@/shared/client';

export function useDocuments() {
    const documentRequests = ref([]);

    const loadMyDocuments = async () => {
        try {
            const data = await apiFetch('/documents/my');
            documentRequests.value = data.data || data || [];
        } catch (err) {
            console.error('Failed to load documents', err);
            documentRequests.value = [];
        }
    };

    const createDocumentRequest = async (payload) => {
        try {
            await apiFetch('/documents/request', { method: 'POST', body: JSON.stringify(payload) });
            await loadMyDocuments();
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    return { documentRequests, loadMyDocuments, createDocumentRequest };
}
