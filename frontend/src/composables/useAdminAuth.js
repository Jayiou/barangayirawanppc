import { ref, reactive } from 'vue';
import { apiFetch, setAuth, clearAuth, getAuth } from '@/shared/client';

export function useAdminAuth() {
    const isAuthenticated = ref(false);
    const user = ref(null);
    const authView = ref('login');
    const loginForm = reactive({ username: '', password: '' });
    const forgotPasswordForm = reactive({ email: '' });
    const resetPasswordForm = reactive({ email: '', resetToken: '', password: '', confirmPassword: '' });
    const loginStatus = ref('');
    const loginError = ref(false);
    const initializing = ref(true);
    const loginLoading = ref(false);
    const forgotPasswordLoading = ref(false);
    const resetPasswordLoading = ref(false);

    const setAuthView = (view) => {
        authView.value = view;
        loginStatus.value = '';
        loginError.value = false;
    };

    const clearResetUrl = () => {
        if (!globalThis.history?.replaceState) return;
        const url = new URL(globalThis.location.href);
        url.searchParams.delete('resetToken');
        url.searchParams.delete('email');
        url.searchParams.delete('redirect');
        globalThis.history.replaceState({}, '', url.pathname + url.search);
    };

    const hydrateAdminResetFromUrl = () => {
        const params = new URLSearchParams(globalThis.location.search);
        const resetToken = params.get('resetToken') || '';
        const email = params.get('email') || '';

        if (!resetToken || !email) {
            return false;
        }

        resetPasswordForm.resetToken = resetToken;
        resetPasswordForm.email = email;
        authView.value = 'reset';
        loginStatus.value = 'Reset link verified. Enter your new password.';
        loginError.value = false;
        return true;
    };

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

    const requestAdminPasswordReset = async () => {
        if (forgotPasswordLoading.value) return;

        if (!forgotPasswordForm.email) {
            loginStatus.value = 'Please enter the email registered to the admin account.';
            loginError.value = true;
            return;
        }

        forgotPasswordLoading.value = true;
        try {
            const response = await apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({
                    email: forgotPasswordForm.email,
                    appUrl: globalThis.location?.origin || '',
                    redirectPath: '/admin',
                    redirect: 'admin-reset'
                })
            });

            forgotPasswordForm.email = '';
            loginStatus.value = response.message || 'If the request is valid, a password reset link has been sent.';
            loginError.value = false;
        } catch (error) {
            if (error?.status === 429) {
                loginStatus.value = 'Too many reset attempts. Please wait and try again.';
            } else {
                loginStatus.value = error?.message || 'Unable to send reset link right now. Please try again.';
            }
            loginError.value = true;
        } finally {
            forgotPasswordLoading.value = false;
        }
    };

    const submitAdminPasswordReset = async () => {
        if (resetPasswordLoading.value) return;

        if (!resetPasswordForm.email || !resetPasswordForm.resetToken) {
            loginStatus.value = 'The reset link is missing required information. Please request a new one.';
            loginError.value = true;
            return;
        }

        if (!resetPasswordForm.password || !resetPasswordForm.confirmPassword) {
            loginStatus.value = 'Please enter and confirm your new password.';
            loginError.value = true;
            return;
        }

        resetPasswordLoading.value = true;
        try {
            const response = await apiFetch('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({
                    email: resetPasswordForm.email,
                    resetToken: resetPasswordForm.resetToken,
                    password: resetPasswordForm.password,
                    confirmPassword: resetPasswordForm.confirmPassword
                })
            });

            clearResetUrl();
            resetPasswordForm.email = '';
            resetPasswordForm.resetToken = '';
            resetPasswordForm.password = '';
            resetPasswordForm.confirmPassword = '';
            authView.value = 'login';
            loginStatus.value = response.message || 'Password reset successful. You can now log in.';
            loginError.value = false;
        } catch (error) {
            if (error?.status === 429) {
                loginStatus.value = 'Too many reset attempts. Please wait and try again.';
            } else if (error?.status === 400 && error?.message === 'Password reset link is invalid or expired.') {
                loginStatus.value = 'This reset link is no longer valid. Please request a new one.';
            } else {
                loginStatus.value = error?.message || 'Unable to reset password right now. Please try again.';
            }
            loginError.value = true;
        } finally {
            resetPasswordLoading.value = false;
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
        authView,
        loginForm,
        forgotPasswordForm,
        resetPasswordForm,
        loginStatus,
        loginError,
        loginLoading,
        forgotPasswordLoading,
        resetPasswordLoading,
        initializing,
        setAuthView,
        hydrateAdminResetFromUrl,
        loginAdmin,
        requestAdminPasswordReset,
        submitAdminPasswordReset,
        logout,
        initSession
    };
}
