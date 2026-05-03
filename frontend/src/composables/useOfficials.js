import { ref, reactive } from 'vue';
import { apiFetch } from '@/shared/client';

export function useOfficials() {
    const officials = ref([]);
    const editForm = reactive({
        fullName: '',
        position: '',
        office: '',
        phoneNumber: '',
        email: '',
        officeDays: ''
    });

    const saveOfficial = async (isEdit) => {
        try {
            const payload = {
                ...editForm,
                officeDays: editForm.officeDays ? editForm.officeDays.split(',').map(d => d.trim()) : []
            };

            if (isEdit && editForm._id) {
                await apiFetch(`/officials/${editForm._id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/officials', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }
            resetForm();
            await loadOfficials();
        } catch (error) {
            throw new Error(error.message || 'Failed to save official');
        }
    };

    const deleteOfficial = async (itemId) => {
        try {
            await apiFetch(`/officials/${itemId}`, { method: 'DELETE' });
            await loadOfficials();
        } catch (error) {
            throw new Error(error.message || 'Failed to delete official');
        }
    };

    const loadOfficials = async () => {
        try {
            officials.value = await apiFetch('/officials');
        } catch (error) {
            console.error('Failed to load officials:', error);
        }
    };

    const resetForm = () => {
        editForm.fullName = '';
        editForm.position = '';
        editForm.office = '';
        editForm.phoneNumber = '';
        editForm.email = '';
        editForm.officeDays = '';
        delete editForm._id;
    };

    return {
        officials,
        editForm,
        saveOfficial,
        deleteOfficial,
        loadOfficials,
        resetForm
    };
}
