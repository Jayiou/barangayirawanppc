import { reactive, ref } from 'vue';
import { apiFetch, setAuth, clearAuth } from '@/shared/client';

const PENDING_OTP_EMAIL_KEY = 'barangayPendingOtpEmail';

const getPendingOtpEmail = () => {
    try {
        return sessionStorage.getItem(PENDING_OTP_EMAIL_KEY) || '';
    } catch {
        return '';
    }
};

const setPendingOtpEmail = (email) => {
    try {
        sessionStorage.setItem(PENDING_OTP_EMAIL_KEY, email);
    } catch {
        // Some mobile/private browsers disable sessionStorage.
    }
};

const clearPendingOtpEmail = () => {
    try {
        sessionStorage.removeItem(PENDING_OTP_EMAIL_KEY);
    } catch {
        // Some mobile/private browsers disable sessionStorage.
    }
};

const isStrongPassword = (password) => {
    const value = String(password || '');
    return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
};

export function useLandingAuth() {
    const loginForm = reactive({ username: '', password: '' });
    const registerForm = reactive({ 
        username: '', email: '', password: '', confirmPassword: '',
        firstName: '', lastName: '', sex: 'male', 
        birthDate: '', contactNumber: '', address: '', purok: '',
        isSeniorCitizen: false, isPWD: false, vulnerabilityType: '', verificationPending: false
    });
    const proofOfResidencyFile = ref(null);
    const vulnerabilityProofFile = ref(null);
    const otpForm = reactive({ email: '', code: '' });

    const handleResidentAuth = async (path, payload) => {
        try {
            const response = await apiFetch(path, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.user.role !== 'resident') {
                clearAuth();
                return { success: false, message: 'Resident access only is available on this homepage.' };
            }

            setAuth(response.token, response.user);
            globalThis.location.href = '/portal';
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const loginResident = (loginForm) => {
        if (!loginForm.username || !loginForm.password) {
            return { success: false, message: 'Please enter both username and password.' };
        }
        return handleResidentAuth('/auth/login', loginForm);
    };

    const registerResident = async (registerForm, proofOfResidencyFile, recaptchaToken) => {
        if (!registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.username || !registerForm.contactNumber) {
            return { success: false, message: 'Please fill in all required fields.' };
        }

        if (registerForm.password.length < 8) {
            return { success: false, message: 'Password must be at least 8 characters long.' };
        }

        if (!isStrongPassword(registerForm.password)) {
            return { success: false, message: 'Password must include at least 1 uppercase letter, 1 number, and 1 special character.' };
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            return { success: false, message: 'Passwords do not match.' };
        }

        if (!proofOfResidencyFile) {
            return { success: false, message: 'Please upload proof of residency (ID or document).' };
        }

        if (!recaptchaToken) {
            return { success: false, message: 'Please verify the reCAPTCHA checkbox.' };
        }

        try {
            const formData = new FormData();
            Object.entries(registerForm).forEach(([key, value]) => {
                if (key !== 'confirmPassword') formData.append(key, value);
            });
            
            formData.append('recaptchaToken', recaptchaToken);
            formData.append('proofOfResidency', proofOfResidencyFile);
            if (vulnerabilityProofFile.value) {
                formData.append('vulnerabilityProof', vulnerabilityProofFile.value);
            }

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, email: registerForm.email, message: 'Registration successful! Please check your email for the OTP code. If you do not see it in your inbox, please check your Spam folder.' };
            } else {
                return { success: false, message: data.message || 'Registration failed. Please try again.' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed. Please check your connection and try again.' };
        }
    };

    const verifyOtp = async (otpForm) => {
        if (!otpForm.email || !otpForm.code) {
            return { success: false, message: 'Please enter both email and OTP code.' };
        }

        if (otpForm.code.length !== 6) {
            return { success: false, message: 'OTP code must be exactly 6 digits.' };
        }

        try {
            await apiFetch('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify({ email: otpForm.email, otpCode: otpForm.code })
            });
            clearPendingOtpEmail();
            return { success: true, message: 'Email verified successfully! Your account is now pending admin approval.' };
        } catch (error) {
            return { success: false, message: error.message || 'OTP verification failed. Please try again.' };
        }
    };

    const resendOtp = async (otpForm) => {
        if (!otpForm.email) {
            return { success: false, message: 'Please enter your email address first.' };
        }

        try {
            await apiFetch('/auth/resend-otp', {
                method: 'POST',
                body: JSON.stringify({ email: otpForm.email })
            });
            setPendingOtpEmail(otpForm.email);
            return { success: true, message: 'If your email has a pending verification, a new OTP has been sent. If you do not see it in your inbox, please check your Spam folder.' };
        } catch (error) {
            return { success: false, message: error.message || 'Unable to resend OTP right now.' };
        }
    };

    const handleFileUpload = (event) => {
        proofOfResidencyFile.value = event.target.files[0];
    };

    const handleVulnerabilityProofUpload = (event) => {
        vulnerabilityProofFile.value = event.target.files[0] || null;
    };

    return {
        loginForm, registerForm, proofOfResidencyFile, vulnerabilityProofFile, otpForm,
        loginResident, registerResident, verifyOtp, resendOtp, handleFileUpload, handleVulnerabilityProofUpload,
        getPendingOtpEmail, setPendingOtpEmail, clearPendingOtpEmail
    };
}
