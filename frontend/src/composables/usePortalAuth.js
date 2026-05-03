import { ref } from 'vue';
import { apiFetch, clearAuth } from '@/shared/client';

export function usePortalAuth() {
    const user = ref(null);

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
            globalThis.location.href = '/';
            return false;
        }
    };

    const logout = () => {
        clearAuth();
        globalThis.location.href = '/';
    };

    return { user, ensureResident, logout };
}
