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

const normalizeContactNumber = (value) => {
    const rawValue = String(value || '').trim().replace(/\s|-/g, '');
    if (/^09\d{9}$/.test(rawValue)) return rawValue;
    if (/^\+639\d{9}$/.test(rawValue)) return `0${rawValue.slice(3)}`;
    if (/^639\d{9}$/.test(rawValue)) return `0${rawValue.slice(2)}`;
    return '';
};

const zoneOptionsByPurok = {
    Sampalok: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'],
    Acacia: Array.from({ length: 10 }, (_, index) => `Zone ${index + 5}`)
};

export function useLandingAuth() {
    const loginForm = reactive({ username: '', password: '' });
    const registerForm = reactive({ 
        username: '', email: '', password: '', confirmPassword: '',
        firstName: '', middleName: '', lastName: '', suffix: '', sex: 'male',
        birthDate: '', civilStatus: 'single', citizenship: 'Filipino', occupation: '',
        contactNumber: '+63', address: 'Barangay Irawan', purok: '', zone: '',
        floodProneArea: false
    });
    const proofOfResidencyFile = ref(null);
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
        const fieldErrors = {};
        if (!registerForm.firstName) fieldErrors.firstName = 'First name is required.';
        if (!registerForm.lastName) fieldErrors.lastName = 'Last name is required.';
        if (!registerForm.sex) fieldErrors.sex = 'Gender is required.';
        if (!registerForm.birthDate) fieldErrors.birthDate = 'Birth date is required.';
        if (!registerForm.contactNumber) fieldErrors.contactNumber = 'Contact number is required.';
        if (!registerForm.email) fieldErrors.email = 'Email address is required.';
        if (!registerForm.username) fieldErrors.username = 'Username is required.';
        if (!registerForm.password) fieldErrors.password = 'Password is required.';
        if (!registerForm.confirmPassword) fieldErrors.confirmPassword = 'Please confirm your password.';
        if (Object.keys(fieldErrors).length) {
            return { success: false, message: 'Please fill in all required fields.', fieldErrors };
        }

        const normalizedContactNumber = normalizeContactNumber(registerForm.contactNumber);
        if (!normalizedContactNumber) {
            return { success: false, message: 'Contact number must be a valid PH number: 09XXXXXXXXX or +639XXXXXXXXX.', fieldErrors: { contactNumber: 'Enter a valid PH number: 09XXXXXXXXX or +639XXXXXXXXX.' } };
        }

        if (!registerForm.purok) {
            return { success: false, message: 'Please select a Purok.', fieldErrors: { purok: 'Please select a Purok.' } };
        }

        const requiredZones = zoneOptionsByPurok[registerForm.purok] || [];
        if (requiredZones.length && !requiredZones.includes(registerForm.zone)) {
            return { success: false, message: `Please select a zone for Purok ${registerForm.purok}.`, fieldErrors: { zone: `Please select a zone for Purok ${registerForm.purok}.` } };
        }

        if (registerForm.password.length < 8) {
            return { success: false, message: 'Password must be at least 8 characters long.', fieldErrors: { password: 'Password must be at least 8 characters long.' } };
        }

        if (!isStrongPassword(registerForm.password)) {
            return { success: false, message: 'Password must include at least 1 uppercase letter, 1 number, and 1 special character.', fieldErrors: { password: 'Add at least 1 uppercase letter, 1 number, and 1 special character.' } };
        }

        if (registerForm.password !== registerForm.confirmPassword) {
            return { success: false, message: 'Passwords do not match.', fieldErrors: { confirmPassword: 'Passwords do not match.' } };
        }

        if (!proofOfResidencyFile) {
            return { success: false, message: 'Please upload proof of residency (ID or document).', fieldErrors: { proofOfResidency: 'Please upload proof of residency.' } };
        }

        if (!recaptchaToken) {
            return { success: false, message: 'Please verify the reCAPTCHA checkbox.', fieldErrors: { recaptcha: 'Please verify the reCAPTCHA checkbox.' } };
        }

        try {
            const formData = new FormData();
            Object.entries(registerForm).forEach(([key, value]) => {
                if (key !== 'confirmPassword') formData.append(key, value);
            });
            formData.set('address', 'Barangay Irawan');
            formData.set('contactNumber', normalizedContactNumber);
            
            formData.append('recaptchaToken', recaptchaToken);
            formData.append('proofOfResidency', proofOfResidencyFile);
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, email: registerForm.email, message: 'Registration successful! Please check your email for the OTP code. If you do not see it in your inbox, please check your Spam folder.' };
            } else {
                return { success: false, message: data.message || 'Registration failed. Please try again.', fieldErrors: data.fields || {} };
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

    return {
        loginForm, registerForm, proofOfResidencyFile, otpForm,
        loginResident, registerResident, verifyOtp, resendOtp, handleFileUpload,
        getPendingOtpEmail, setPendingOtpEmail, clearPendingOtpEmail
    };
}
