import { ref, reactive } from 'vue';
import { apiFetch, setAuth, clearAuth, getAuth } from '@/shared/client';

export function useAdminAuth() {
    const isAuthenticated = ref(false);
    const user = ref(null);
    const loginForm = reactive({ username: '', password: '' });
    const loginStatus = ref('');
    const loginError = ref(false);
    const initializing = ref(true);
    const loginLoading = ref(false);

    const loginAdmin = async () => {
        if (loginLoading.value) return;
        
        if (!loginForm.username || !loginForm.password) {
            loginStatus.value = 'Please enter both username and password.';
            loginError.value = true;
            return;
        }

        loginLoading.value = true;
        try {
            loginStatus.value = 'Signing in...';
            loginError.value = false;
            
            const response = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify(loginForm)
            });

            if (response.user.role !== 'admin') {
                clearAuth();
                loginStatus.value = 'This entry page is for admin accounts only.';
                loginError.value = true;
                return;
            }

            setAuth(response.token, response.user);
            user.value = response.user;
            isAuthenticated.value = true;
            loginStatus.value = 'Login successful!';
            loginError.value = false;
        } catch (error) {
            loginStatus.value = error.message || 'Login failed. Please try again.';
            loginError.value = true;
        } finally {
            loginLoading.value = false;
        }
    };

    const logout = () => {
        clearAuth();
        isAuthenticated.value = false;
        user.value = null;
        loginStatus.value = '';
        loginForm.username = '';
        loginForm.password = '';
    };

    const initSession = async () => {
        const auth = getAuth();
        if (!auth.token) {
            initializing.value = false;
            return;
        }

        try {
            const me = await apiFetch('/auth/me');
            if (me.role === 'admin') {
                user.value = me;
                isAuthenticated.value = true;
            } else {
                clearAuth();
                isAuthenticated.value = false;
            }
        } catch (error) {
            console.error('Session init failed:', error);
            clearAuth();
            isAuthenticated.value = false;
        } finally {
            initializing.value = false;
        }
    };

    return {
        isAuthenticated,
        user,
        loginForm,
        loginStatus,
        loginError,
        loginLoading,
        initializing,
        loginAdmin,
        logout,
        initSession
    };
}
