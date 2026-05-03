import { reactive, ref } from 'vue';
import { apiFetch } from '@/shared/client';

export function usePasswordReset() {
    const forgotPasswordForm = reactive({ email: '' });
    const resetPasswordForm = reactive({ email: '', resetToken: '', password: '', confirmPassword: '' });
    const forgotPasswordLoading = ref(false);
    const resetPasswordLoading = ref(false);

    const clearResetUrl = () => {
        if (globalThis.history?.replaceState) {
            const url = new URL(globalThis.location.href);
            url.searchParams.delete('resetToken');
            url.searchParams.delete('email');
            globalThis.history.replaceState({}, '', url.pathname + url.search);
        }
    };

    const hydrateResetPasswordFromUrl = () => {
        const params = new URLSearchParams(globalThis.location.search);
        const resetToken = params.get('resetToken') || '';
        const email = params.get('email') || '';

        if (!resetToken || !email) {
            return false;
        }

        resetPasswordForm.resetToken = resetToken;
        resetPasswordForm.email = email;
        return true;
    };

    const requestPasswordReset = async () => {
        if (!forgotPasswordForm.email) {
            return { success: false, message: 'Please enter your email address.' };
        }

        try {
            forgotPasswordLoading.value = true;
            const response = await apiFetch('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({
                    email: forgotPasswordForm.email,
                    appUrl: globalThis.location?.origin || ''
                })
            });

            forgotPasswordForm.email = '';
            return { success: true, message: response.message || 'If the request is valid, a password reset link has been sent.' };
        } catch (error) {
            if (error?.status === 429) {
                return { success: false, message: 'Too many reset attempts. Please wait and try again.' };
            } else {
                return { success: false, message: 'Unable to send password reset link right now. Please check your connection and try again.' };
            }
        } finally {
            forgotPasswordLoading.value = false;
        }
    };

    const submitPasswordReset = async () => {
        if (!resetPasswordForm.email || !resetPasswordForm.resetToken) {
            return { success: false, message: 'The reset link is missing required information. Please request a new one.' };
        }

        if (!resetPasswordForm.password || !resetPasswordForm.confirmPassword) {
            return { success: false, message: 'Please enter and confirm your new password.' };
        }

        if (resetPasswordForm.password.length < 8) {
            return { success: false, message: 'Password must be at least 8 characters long.' };
        }

        if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
            return { success: false, message: 'Passwords do not match.' };
        }

        try {
            resetPasswordLoading.value = true;
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
            
            return { success: true, message: response.message || 'Password reset successful. You can now log in.' };
        } catch (error) {
            if (error?.status === 429) {
                return { success: false, message: 'Too many reset attempts. Please wait and try again.' };
            } else if (error?.code === 'NETWORK_ERROR' || error?.status === 0) {
                return { success: false, message: 'Cannot connect to the server. Please make sure your device can access this site and try again.' };
            } else if (error?.status === 400 && error?.message === 'Password reset link is invalid or expired.') {
                return { success: false, message: 'This reset link is no longer valid. Please request a new one.' };
            } else {
                return { success: false, message: error?.message || 'Unable to reset password right now. Please check your connection and try again.' };
            }
        } finally {
            resetPasswordLoading.value = false;
        }
    };

    return {
        forgotPasswordForm, resetPasswordForm, forgotPasswordLoading, resetPasswordLoading,
        clearResetUrl, hydrateResetPasswordFromUrl, requestPasswordReset, submitPasswordReset
    };
}
