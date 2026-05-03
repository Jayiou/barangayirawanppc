import { ref, reactive, computed } from 'vue';
import { apiFetch, getAuth } from '@/shared/client';

export function useResidents(sourceResidents = null) {
    const residents = ref([]);
    const residentSearch = ref('');
    const editForm = reactive({ status: '' });

    const residentSource = computed(() => sourceResidents?.value || residents.value);

    const normalizeText = (text) => (text || '').toLowerCase().replaceAll(/\s+/g, ' ').trim();

    const calculateAge = (birthDateString) => {
        if (!birthDateString) return 0;
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return Math.max(0, age);
    };

    const filteredResidents = computed(() => {
        if (!residentSearch.value) return residentSource.value;
        const searchNorm = normalizeText(residentSearch.value);
        return residentSource.value.filter(r =>
            normalizeText(`${r.firstName} ${r.lastName} ${r.email} ${r.username}`).includes(searchNorm)
        );
    });

    const saveResidentStatus = async (itemId, status) => {
        try {
            await apiFetch(`/residents/${itemId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            await loadResidents();
        } catch (error) {
            throw new Error(error.message || 'Failed to update resident status');
        }
    };

    const openResidentProof = async (itemId) => {
        try {
            const response = await fetch(`/api/residents/${itemId}/proof`, {
                headers: { Authorization: `Bearer ${getAuth()?.token || ''}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load proof of residency');
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank', 'noopener');
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000);
        } catch (error) {
            throw new Error(error.message || 'Failed to open proof document');
        }
    };

    const loadResidents = async () => {
        try {
            residents.value = await apiFetch('/residents');
        } catch (error) {
            console.error('Failed to load residents:', error);
        }
    };

    return {
        residents,
        residentSearch,
        editForm,
        filteredResidents,
        calculateAge,
        saveResidentStatus,
        openResidentProof,
        loadResidents
    };
}
