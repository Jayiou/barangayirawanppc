import { ref, reactive } from 'vue';
import { apiFetch } from '@/shared/client';

export function useAnnouncements() {
    const announcements = ref([]);
    const announcementImageFile = ref(null);
    const nextDisplayOrder = ref(null);
    const nextDisplayOrderLoading = ref(false);
    const announcementForm = reactive({
        title: '',
        description: '',
        displayOrder: 1,
        startDate: '',
        endDate: '',
        isActive: true
    });

    const fetchNextDisplayOrder = async () => {
        try {
            nextDisplayOrderLoading.value = true;
            const response = await apiFetch('/announcements/admin/next-order');
            nextDisplayOrder.value = response?.data?.nextDisplayOrder || 1;
        } catch (error) {
            console.error('Failed to fetch next display order:', error);
            nextDisplayOrder.value = 1;
        } finally {
            nextDisplayOrderLoading.value = false;
        }
    };

    const resetAnnouncementForm = () => {
        announcementForm.title = '';
        announcementForm.description = '';
        announcementForm.displayOrder = nextDisplayOrder.value || 1;
        announcementForm.startDate = '';
        announcementForm.endDate = '';
        announcementForm.isActive = true;
        announcementImageFile.value = null;
    };

    const onImageUpload = (event) => {
        announcementImageFile.value = event.target.files[0];
    };

    const saveAnnouncement = async (isEdit, itemId) => {
        if (!announcementForm.title.trim()) {
            throw new Error('Please enter an announcement title.');
        }

        const formData = new FormData();
        formData.append('title', announcementForm.title);
        formData.append('description', announcementForm.description);
        formData.append('startDate', announcementForm.startDate || '');
        formData.append('endDate', announcementForm.endDate || '');
        formData.append('isActive', announcementForm.isActive !== false);

        if (isEdit) {
            const order = Math.max(1, Number.parseInt(announcementForm.displayOrder, 10) || 1);
            formData.append('displayOrder', order);
        }

        if (announcementImageFile.value) {
            formData.append('image', announcementImageFile.value);
        }

        try {
            if (isEdit) {
                await apiFetch(`/announcements/${itemId}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                await apiFetch('/announcements', {
                    method: 'POST',
                    body: formData
                });
            }
            resetAnnouncementForm();
        } catch (error) {
            throw new Error(error.message || 'Failed to save announcement');
        }
    };

    const deleteAnnouncement = async (itemId) => {
        try {
            await apiFetch(`/announcements/${itemId}`, { method: 'DELETE' });
        } catch (error) {
            throw new Error(error.message || 'Failed to delete announcement');
        }
    };

    const loadAnnouncements = async () => {
        try {
            const response = await apiFetch('/announcements/admin/all');
            announcements.value = response.data || response;
        } catch (error) {
            console.error('Failed to load announcements:', error);
        }
    };

    return {
        announcements,
        announcementImageFile,
        nextDisplayOrder,
        nextDisplayOrderLoading,
        announcementForm,
        fetchNextDisplayOrder,
        resetAnnouncementForm,
        onImageUpload,
        saveAnnouncement,
        deleteAnnouncement,
        loadAnnouncements
    };
}
