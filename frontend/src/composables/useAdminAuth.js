import { ref, reactive } from 'vue';
import { apiFetch, setAuth, clearAuth, getAuth } from '@/shared/client';

export function useAdminAuth() {
    const isAuthenticated = ref(false);
    const user = ref(null);
    const authView = ref('login');
    const loginForm = reactive({ username: '', password: '' });
    const forgotPasswordForm = reactive({ email: '' });
    const resetPasswordForm = reactive({ email: '', resetToken: '', password: '', confirmPassword: '' });
    const profileForm = reactive({ newEmail: '', currentPassword: '' });
    const emailChangeConfirmForm = reactive({ email: '', emailChangeToken: '' });
    const loginStatus = ref('');
    const profileStatus = ref('');
    const loginError = ref(false);
    const profileError = ref(false);
    const initializing = ref(true);
    const loginLoading = ref(false);
    const forgotPasswordLoading = ref(false);
    const resetPasswordLoading = ref(false);
    const profileLoading = ref(false);
    const emailChangeConfirmLoading = ref(false);

    const setAuthView = (view) => {
        authView.value = view;
        loginStatus.value = '';
        loginError.value = false;
    };

    const setProfileStatus = (message = '', isError = false) => {
        profileStatus.value = message;
        profileError.value = isError;
    };

    const clearResetUrl = () => {
        if (!globalThis.history?.replaceState) return;
        const url = new URL(globalThis.location.href);
        url.searchParams.delete('resetToken');
        url.searchParams.delete('email');
        url.searchParams.delete('redirect');
        globalThis.history.replaceState({}, '', url.pathname + url.search);
    };

    const clearEmailChangeUrl = () => {
        if (!globalThis.history?.replaceState) return;
        const url = new URL(globalThis.location.href);
        url.searchParams.delete('emailChangeToken');
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

    const hydrateAdminEmailChangeFromUrl = () => {
        const params = new URLSearchParams(globalThis.location.search);
        const emailChangeToken = params.get('emailChangeToken') || '';
        const email = params.get('email') || '';

        if (!emailChangeToken || !email) {
            return false;
        }

        emailChangeConfirmForm.emailChangeToken = emailChangeToken;
        emailChangeConfirmForm.email = email;
        authView.value = 'email-confirm';
        loginStatus.value = 'Confirming your new admin email...';
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
            syncAdminProfileFormFromUser();
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

    const requestAdminEmailChange = async () => {
        if (profileLoading.value) return;

        if (!profileForm.newEmail || !profileForm.currentPassword) {
            setProfileStatus('Current password and new email are required.', true);
            return;
        }

        profileLoading.value = true;
        try {
            const response = await apiFetch('/auth/admin/email-change-request', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword: profileForm.currentPassword,
                    newEmail: profileForm.newEmail,
                    appUrl: globalThis.location?.origin || '',
                    redirectPath: '/admin'
                })
            });

            profileForm.currentPassword = '';
            profileForm.newEmail = '';
            if (user.value) {
                user.value = { ...user.value, pendingEmail: response.pendingEmail || user.value.pendingEmail || '' };
                const auth = getAuth();
                if (auth.token) {
                    setAuth(auth.token, user.value);
                }
            }
            setProfileStatus(response.message || 'A confirmation link has been sent to the new email address.', false);
        } catch (error) {
            setProfileStatus(error?.message || 'Unable to update admin email right now. Please try again.', true);
        } finally {
            profileLoading.value = false;
        }
    };

    const confirmAdminEmailChange = async () => {
        if (emailChangeConfirmLoading.value) return;

        if (!emailChangeConfirmForm.email || !emailChangeConfirmForm.emailChangeToken) {
            loginStatus.value = 'The email confirmation link is missing required information.';
            loginError.value = true;
            return;
        }

        emailChangeConfirmLoading.value = true;
        try {
            const response = await apiFetch('/auth/admin/email-change-confirm', {
                method: 'POST',
                body: JSON.stringify({
                    email: emailChangeConfirmForm.email,
                    emailChangeToken: emailChangeConfirmForm.emailChangeToken
                })
            });

            clearEmailChangeUrl();
            emailChangeConfirmForm.email = '';
            emailChangeConfirmForm.emailChangeToken = '';
            if (response.user && user.value) {
                user.value = { ...user.value, ...response.user, pendingEmail: '' };
                const auth = getAuth();
                if (auth.token) {
                    setAuth(auth.token, user.value);
                }
            }
            authView.value = 'login';
            loginStatus.value = response.message || 'Admin email updated successfully.';
            loginError.value = false;
        } catch (error) {
            loginStatus.value = error?.message || 'Unable to confirm the new email right now.';
            loginError.value = true;
        } finally {
            emailChangeConfirmLoading.value = false;
        }
    };

    const logout = () => {
        clearAuth();
        isAuthenticated.value = false;
        user.value = null;
        loginStatus.value = '';
        profileStatus.value = '';
        loginForm.username = '';
        loginForm.password = '';
        profileForm.newEmail = '';
        profileForm.currentPassword = '';
        emailChangeConfirmForm.email = '';
        emailChangeConfirmForm.emailChangeToken = '';
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
                syncAdminProfileFormFromUser();
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

    const syncAdminProfileFormFromUser = () => {
        profileForm.newEmail = '';
        profileForm.currentPassword = '';
        setProfileStatus('');

        if (user.value?.pendingEmail) {
            setProfileStatus(`Pending confirmation: ${user.value.pendingEmail}`);
        }
    };

    return {
        isAuthenticated,
        user,
        authView,
        loginForm,
        forgotPasswordForm,
        resetPasswordForm,
        profileForm,
        emailChangeConfirmForm,
        loginStatus,
        profileStatus,
        loginError,
        profileError,
        loginLoading,
        forgotPasswordLoading,
        resetPasswordLoading,
        profileLoading,
        emailChangeConfirmLoading,
        initializing,
        setAuthView,
        setProfileStatus,
        hydrateAdminResetFromUrl,
        hydrateAdminEmailChangeFromUrl,
        loginAdmin,
        requestAdminPasswordReset,
        submitAdminPasswordReset,
        requestAdminEmailChange,
        confirmAdminEmailChange,
        syncAdminProfileFormFromUser,
        logout,
        initSession
    };
}
