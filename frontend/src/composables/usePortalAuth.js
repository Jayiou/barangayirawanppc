import { ref } from 'vue';
import { apiFetch, clearAuth } from '@/shared/client';

const PORTAL_VIEW_STORAGE_KEY = 'barangayPortalCurrentView';

export function usePortalAuth() {
    const user = ref(null);
    const initializing = ref(true);

    const ensureResident = async () => {
        try {
            const me = await apiFetch('/auth/me');
            if (me.role !== 'resident') {
                globalThis.location.href = '/admin';
                return false;
            }
            user.value = me;
            return true;
        } catch (error) {
            console.error('Session check failed:', error);
            clearAuth();
            globalThis.sessionStorage?.removeItem(PORTAL_VIEW_STORAGE_KEY);
            globalThis.location.href = '/';
            return false;
        } finally {
            initializing.value = false;
        }
    };

    const logout = () => {
        clearAuth();
        globalThis.sessionStorage?.removeItem(PORTAL_VIEW_STORAGE_KEY);
        globalThis.location.href = '/';
    };

    return { user, initializing, ensureResident, logout };
}
