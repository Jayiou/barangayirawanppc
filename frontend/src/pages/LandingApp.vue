<template>
    <div class="page-shell landing-shell">
        <header class="landing-topbar">
            <div class="landing-topbar-inner">
                <BrandMark initials="BI" eyebrow="Management System" title="Barangay Irawan" />
                <nav class="landing-nav">
                    <button type="button" class="landing-nav-button" @click="openModal('login')">Resident Login</button>
                    <a href="#services">Services</a>
                    <button type="button" class="landing-nav-button" @click="openModal('otp')">Verify OTP</button>
                    <button type="button" class="landing-register-link" @click="openModal('register')">Register</button>
                </nav>
            </div>
        </header>

        <section class="landing-hero">
            <div class="landing-hero-overlay"></div>
            <div class="landing-hero-content">
                <span class="eyebrow light">Barangay Digital Services</span>
                <h2>Welcome to Barangay Irawan</h2>
                <h3>Puerto Princesa City</h3>
                <p>
                    Your gateway to efficient, modern barangay services. Access documents, schedule
                    appointments, report incidents, and stay connected with your community, all in one place.
                </p>
            </div>
        </section>

        <section class="landing-services-section" id="services">
            <div class="landing-section-heading center">
                <h3>Barangay Services</h3>
                <p>Everything you need to connect with Barangay Irawan and access essential community services.</p>
            </div>

            <div class="landing-service-grid">
                <article v-for="service in services" :key="service.title" class="landing-service-card">
                    <div class="landing-service-icon">{{ service.icon }}</div>
                    <h4>{{ service.title }}</h4>
                    <p>{{ service.copy }}</p>
                </article>
            </div>
        </section>

        <section class="landing-lower-grid">
            <AnnouncementSlideshow />
        </section>

        <section class="landing-cta-band">
            <div class="landing-cta-band-inner">
                <h3>Ready to Get Started?</h3>
                <p>Join residents already using our integrated barangay management system for faster and clearer service access.</p>
                <button type="button" class="landing-cta solid" @click="openModal('register')">Register Now</button>
            </div>
        </section>

        <footer class="landing-footer">
            <div class="landing-footer-inner">
                <div class="landing-footer-brand">
                    <div class="brand-mark small">BI</div>
                    <div>
                        <strong>Barangay Irawan</strong>
                        <div class="fine-print">Puerto Princesa City</div>
                    </div>
                </div>
                <div class="fine-print">© 2026 Barangay Irawan. All rights reserved.</div>
            </div>
        </footer>

        <div v-if="activeModal" class="auth-modal-backdrop" @click.self="closeModal">
            <div class="auth-modal-container" :class="{ 'is-register': activeModal === 'register' }">
                <button type="button" class="auth-modal-close" @click="closeModal"><i class="fa-solid fa-xmark"></i></button>

                <!-- Left Visual Panel -->
                <div class="auth-modal-visual">
                    <div class="visual-overlay"></div>
                    <div class="visual-content">
                        <BrandMark initials="BI" eyebrow="Barangay Irawan" title="Resident Portal" />
                        <div class="visual-text">
                            <h3>{{ getVisualTitle(activeModal) }}</h3>
                            <p>
                                {{ getVisualCopy(activeModal) }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Right Form Panel -->
                <div class="auth-modal-form-area">
                    <div class="form-header">
                        <h2>{{ getModalTitle(activeModal) }}</h2>
                        <div class="auth-toggle" v-if="activeModal !== 'otp'">
                            <span class="toggle-text">
                                {{ activeModal === 'login' ? "Don't have an account?" : activeModal === 'forgot-password' || activeModal === 'reset-password' ? 'Need to go back?' : 'Already have an account?' }}
                            </span>
                            <button type="button" class="toggle-link" @click="switchAuthMode">
                                {{ getToggleLabel(activeModal) }}
                            </button>
                        </div>
                    </div>

                    <transition name="fade-slide" mode="out-in">
                        <div :key="activeModal" class="form-transition-wrapper">
                            <ToastPopup :message="toastMessage" :type="toastType" @close="clearToast" />

                            <!-- Login Form -->
                            <form v-if="activeModal === 'login'" class="modern-form" @submit.prevent="handleLogin">
                                <div class="input-group">
                                    <label for="login-username">Username</label>
                                    <div class="input-wrapper">
                                        <i class="fa-regular fa-user"></i>
                                        <input id="login-username" name="username" v-model="loginForm.username" type="text" autocomplete="username" placeholder="Enter your username" required>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label for="login-password">Password</label>
                                    <div class="input-wrapper has-toggle">
                                        <i class="fa-solid fa-lock"></i>
                                        <input id="login-password" name="password" v-model="loginForm.password" :type="passwordVisibility.login ? 'text' : 'password'" placeholder="Enter your password" required>
                                        <button
                                            type="button"
                                            class="password-toggle-btn"
                                            :aria-label="passwordVisibility.login ? 'Hide password' : 'Show password'"
                                            @click="togglePasswordVisibility('login')"
                                        >
                                            <i :class="passwordVisibility.login ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" class="auth-submit-btn">
                                    Login to Portal <i class="fa-solid fa-arrow-right"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="openModal('forgot-password')">
                                    Forgot password?
                                </button>
                            </form>

                            <!-- Registration Form -->
                            <form v-else-if="activeModal === 'register'" class="modern-form register-form" @submit.prevent="handleRegister">
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-firstname">First Name</label>
                                        <input id="reg-firstname" name="firstName" v-model="registerForm.firstName" type="text" autocomplete="given-name" placeholder="Juan" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-lastname">Last Name</label>
                                        <input id="reg-lastname" name="lastName" v-model="registerForm.lastName" type="text" autocomplete="family-name" placeholder="Dela Cruz" required>
                                    </div>
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-sex">Sex</label>
                                        <div class="custom-select">
                                            <select id="reg-sex" name="sex" v-model="registerForm.sex" required>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                            </select>
                                            <i class="fa-solid fa-chevron-down"></i>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-birthdate">Birth Date</label>
                                        <input id="reg-birthdate" name="birthDate" v-model="registerForm.birthDate" type="date" autocomplete="bday" required>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label for="reg-address">Barangay</label>
                                    <input id="reg-address" name="address" v-model="registerForm.address" type="text" autocomplete="address-line1" placeholder="Barangay Irawan" required>
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-contact">Contact Number</label>
                                        <input id="reg-contact" name="contactNumber" v-model="registerForm.contactNumber" type="tel" autocomplete="tel" placeholder="09xxxxxxxxx" required>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-email">Email Address</label>
                                        <input id="reg-email" name="email" v-model="registerForm.email" type="email" autocomplete="email" placeholder="juan@example.com" required>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label for="reg-purok">Purok / Zone</label>
                                    <input id="reg-purok" name="purok" v-model="registerForm.purok" type="text" placeholder="Purok 1" required>
                                </div>
                                <div class="input-group">
                                    <label for="reg-username">Username</label>
                                    <div class="input-wrapper">
                                        <i class="fa-regular fa-user"></i>
                                        <input id="reg-username" name="new-username" v-model="registerForm.username" type="text" autocomplete="username" placeholder="Choose a username" required>
                                    </div>
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reg-password">Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reg-password" name="new-password" v-model="registerForm.password" :type="passwordVisibility.register ? 'text' : 'password'" placeholder="Min. 8 characters" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.register ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('register')"
                                            >
                                                <i :class="passwordVisibility.register ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="reg-confirm">Confirm Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reg-confirm" name="confirm-password" v-model="registerForm.confirmPassword" :type="passwordVisibility.registerConfirm ? 'text' : 'password'" placeholder="Repeat password" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.registerConfirm ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('registerConfirm')"
                                            >
                                                <i :class="passwordVisibility.registerConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="password-rules" aria-live="polite">
                                        <p class="password-rules-title">Password must include:</p>
                                        <ul class="password-rules-list">
                                            <li
                                                v-for="rule in registerPasswordRules"
                                                :key="rule.key"
                                                :class="['password-rule-item', rule.passed ? 'is-pass' : 'is-fail']"
                                            >
                                                <i :class="rule.passed ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                                                <span>{{ rule.label }}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="input-group file-upload-group">
                                    <label for="reg-proof">Proof of Residency (Valid ID / Doc)</label>
                                    <div class="file-upload-wrapper">
                                        <input id="reg-proof" name="proofOfResidency" type="file" @change="handleFileUpload" accept="image/*,application/pdf" required class="file-input">
                                        <div class="upload-btn"><i class="fa-solid fa-cloud-arrow-up"></i> Choose File</div>
                                        <span class="file-name">{{ proofOfResidencyFile ? proofOfResidencyFile.name : 'No file chosen' }}</span>
                                    </div>
                                </div>

                                <div class="recaptcha-shell">
                                    <div id="g-recaptcha" class="recaptcha-container"></div>
                                    <p v-if="!recaptchaReady && !recaptchaError" class="recaptcha-loading">Loading reCAPTCHA...</p>
                                    <p v-else-if="recaptchaError" class="recaptcha-loading recaptcha-error">{{ recaptchaError }}</p>
                                </div>
                                <div class="legal-text">
                                    Protected by reCAPTCHA and subject to the Google 
                                    <a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a> and 
                                    <a href="https://policies.google.com/terms" target="_blank">Terms of Service</a>.
                                </div>
                                
                                <button type="submit" class="auth-submit-btn">
                                    Submit Registration <i class="fa-solid fa-user-plus"></i>
                                </button>
                            </form>

                            <!-- OTP Form -->
                            <form v-else-if="activeModal === 'otp'" class="modern-form otp-form" @submit.prevent="handleVerifyOtp">
                                <p class="otp-instruction">We've sent a 6-digit verification code to your email. Check your inbox (or spam folder).</p>
                                <div class="input-group">
                                    <label for="otp-email">Email Address</label>
                                    <input id="otp-email" name="email" v-model="otpForm.email" type="email" autocomplete="email" required placeholder="juan@example.com">
                                </div>
                                <div class="input-group">
                                    <label for="otp-code">6-Digit OTP Code</label>
                                    <input id="otp-code" name="otp" v-model="otpForm.code" type="text" autocomplete="one-time-code" required maxlength="6" class="otp-input" placeholder="• • • • • •">
                                </div>
                                <button type="submit" class="auth-submit-btn">
                                    Verify Email <i class="fa-solid fa-check"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="resendOtp">
                                    Resend OTP
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="activeModal = 'login'">
                                    Cancel & Go to Login
                                </button>
                            </form>

                            <form v-else-if="activeModal === 'forgot-password'" class="modern-form" @submit.prevent="handleForgotPassword">
                                <p class="otp-instruction">
                                    Enter the email address linked to your account. We will send a reset link if it exists.
                                </p>
                                <div class="input-group">
                                    <label for="forgot-email">Email Address</label>
                                    <input id="forgot-email" name="email" v-model="forgotPasswordForm.email" type="email" autocomplete="email" required placeholder="juan@example.com">
                                </div>
                                <button type="submit" class="auth-submit-btn">
                                    {{ forgotPasswordLoading ? 'Sending...' : 'Send Reset Link' }} <i class="fa-solid fa-paper-plane"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="activeModal = 'login'" :disabled="forgotPasswordLoading">
                                    Back to Login
                                </button>
                            </form>

                            <form v-else-if="activeModal === 'reset-password'" class="modern-form" @submit.prevent="handleResetPassword">
                                <p class="otp-instruction">
                                    Set a new password for your account. The reset link expires after 30 minutes.
                                </p>
                                <div class="input-group">
                                    <label for="reset-email">Email Address</label>
                                    <input id="reset-email" name="email" v-model="resetPasswordForm.email" type="email" autocomplete="email" required placeholder="juan@example.com">
                                </div>
                                <div class="two-col-grid">
                                    <div class="input-group">
                                        <label for="reset-password">New Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reset-password" name="password" v-model="resetPasswordForm.password" :type="passwordVisibility.reset ? 'text' : 'password'" placeholder="New password" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.reset ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('reset')"
                                            >
                                                <i :class="passwordVisibility.reset ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="input-group">
                                        <label for="reset-confirm">Confirm Password</label>
                                        <div class="input-wrapper has-toggle">
                                            <i class="fa-solid fa-lock"></i>
                                            <input id="reset-confirm" name="confirm-password" v-model="resetPasswordForm.confirmPassword" :type="passwordVisibility.resetConfirm ? 'text' : 'password'" placeholder="Repeat password" minlength="8" required>
                                            <button
                                                type="button"
                                                class="password-toggle-btn"
                                                :aria-label="passwordVisibility.resetConfirm ? 'Hide password' : 'Show password'"
                                                @click="togglePasswordVisibility('resetConfirm')"
                                            >
                                                <i :class="passwordVisibility.resetConfirm ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" class="auth-submit-btn">
                                    {{ resetPasswordLoading ? 'Updating...' : 'Update Password' }} <i class="fa-solid fa-key"></i>
                                </button>
                                <button type="button" class="auth-secondary-btn" @click="activeModal = 'login'" :disabled="resetPasswordLoading">
                                    Back to Login
                                </button>
                            </form>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import BrandMark from '@/components/BrandMark.vue';
import AnnouncementSlideshow from '@/components/AnnouncementSlideshow.vue';
import ToastPopup from '@/components/ToastPopup.vue';
import { useLandingAuth } from '@/composables/useLandingAuth';
import { useRecaptcha } from '@/composables/useRecaptcha';
import { usePasswordReset } from '@/composables/usePasswordReset';

// Composables
const { loginForm, registerForm, proofOfResidencyFile, otpForm, loginResident, registerResident, verifyOtp, resendOtp, handleFileUpload, getPendingOtpEmail, setPendingOtpEmail } = useLandingAuth();
const { recaptchaReady, recaptchaError, ensureRecaptchaReady, renderRecaptchaCheckbox, getRecaptchaToken, resetRecaptcha, cleanup } = useRecaptcha();
const { forgotPasswordForm, resetPasswordForm, forgotPasswordLoading, resetPasswordLoading, hydrateResetPasswordFromUrl, requestPasswordReset, submitPasswordReset } = usePasswordReset();

// Local state
const activeModal = ref('');
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;
const passwordVisibility = reactive({
    login: false,
    register: false,
    registerConfirm: false,
    reset: false,
    resetConfirm: false
});

const PASSWORD_SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const isStrongPassword = (password) => {
    const value = String(password || '');
    return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value) && PASSWORD_SPECIAL_CHAR_REGEX.test(value);
};

const registerPasswordRules = computed(() => {
    const password = registerForm.password || '';
    return [
        { key: 'min-length', label: 'At least 8 characters', passed: password.length >= 8 },
        { key: 'uppercase', label: 'At least 1 uppercase letter (A-Z)', passed: /[A-Z]/.test(password) },
        { key: 'number', label: 'At least 1 number (0-9)', passed: /\d/.test(password) },
        { key: 'special', label: 'At least 1 special character', passed: PASSWORD_SPECIAL_CHAR_REGEX.test(password) }
    ];
});

const registerPasswordStrong = computed(() => isStrongPassword(registerForm.password));

const togglePasswordVisibility = (field) => {
    passwordVisibility[field] = !passwordVisibility[field];
};

const clearToast = () => {
    toastMessage.value = '';
    toastType.value = 'success';

    if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
    }
};

const setStatus = (message, isError = false) => {
    clearToast();

    if (!message) {
        return;
    }

    toastMessage.value = message;
    toastType.value = isError ? 'error' : 'success';
    toastTimer = setTimeout(() => {
        clearToast();
    }, 3500);
};

const loadRecaptcha = () => {
    return ensureRecaptchaReady()
        .then(() => {
            renderRecaptchaCheckbox();
        })
        .catch((error) => {
            console.error('reCaptcha loading error:', error);
            setStatus('reCaptcha failed to load. Please refresh the page.', true);
        });
};

// UI helpers
const modalTitles = {
    login: 'Resident Login',
    register: 'Resident Registration',
    otp: 'Email Verification',
    'forgot-password': 'Forgot Password',
    'reset-password': 'Reset Password'
};

const visualTitles = {
    login: 'Welcome Back!',
    register: 'Join Our Community',
    otp: 'Verify Your Email',
    'forgot-password': 'Reset Access Safely',
    'reset-password': 'Choose a New Password'
};

const visualCopies = {
    login: 'Access your digital barangay services, view announcements, and request documents seamlessly.',
    register: 'Create an account to streamline your document requests, appointments, and report submissions.',
    otp: 'We need to verify your email to secure your resident account.',
    'forgot-password': 'We will send a secure reset link to the email address attached to your account.',
    'reset-password': 'Set a new password to restore access to your resident portal.'
};

const getModalTitle = (mode) => modalTitles[mode] || 'Resident Portal';
const getVisualTitle = (mode) => visualTitles[mode] || 'Resident Portal';
const getVisualCopy = (mode) => visualCopies[mode] || 'Access barangay services securely from any device.';

const getToggleLabel = (mode) => {
    if (mode === 'login') return 'Create an account';
    if (mode === 'register') return 'Log in here';
    if (mode === 'forgot-password' || mode === 'reset-password') return 'Back to Login';
    return 'Log in here';
};

const switchAuthMode = () => {
    if (activeModal.value === 'login') {
        activeModal.value = 'register';
        return;
    }

    if (activeModal.value === 'register') {
        activeModal.value = 'login';
        return;
    }

    activeModal.value = 'login';
};

const openModal = (mode) => {
    activeModal.value = mode;
    setStatus('');
    if (mode === 'otp' && !otpForm.email) {
        otpForm.email = getPendingOtpEmail();
    }
    if (mode !== 'reset-password') {
        resetPasswordForm.resetToken = '';
        resetPasswordForm.password = '';
        resetPasswordForm.confirmPassword = '';
    }
    // Pre-load reCaptcha script when registration modal opens
    if (mode === 'register') {
        loadRecaptcha();
    }
};

const closeModal = () => {
    cleanup();
    clearToast();
    activeModal.value = '';
};

const handleLogin = async () => {
    const result = await loginResident(loginForm);
    if (!result.success) {
        setStatus(result.message, true);
        return;
    }

    setStatus('');
};

const handleRegister = async () => {
    if (!registerPasswordStrong.value) {
        setStatus('Password does not meet all required security rules yet.', true);
        return;
    }

    const recaptchaToken = getRecaptchaToken();
    const result = await registerResident(registerForm, proofOfResidencyFile.value, recaptchaToken);
    if (result.success) {
        otpForm.email = result.email;
        setPendingOtpEmail(result.email);
        openModal('otp');
        setStatus(result.message, false);
    } else {
        setStatus(result.message, true);
        resetRecaptcha();
    }
};

const handleVerifyOtp = async () => {
    const result = await verifyOtp(otpForm);
    if (result.success) {
        openModal('login');
        setStatus(result.message, false);
        otpForm.code = '';
    } else {
        setStatus(result.message, true);
    }
};

const handleResendOtp = async () => {
    const result = await resendOtp(otpForm);
    setStatus(result.message, !result.success);
};

const handleForgotPassword = async () => {
    const result = await requestPasswordReset();
    if (result.success) {
        activeModal.value = 'login';
        setStatus(result.message, false);
    } else {
        setStatus(result.message, true);
    }
};

const handleResetPassword = async () => {
    if (resetPasswordForm.password && !isStrongPassword(resetPasswordForm.password)) {
        setStatus('Use a stronger password before submitting the reset form.', true);
        return;
    }

    const result = await submitPasswordReset();
    if (result.success) {
        activeModal.value = 'login';
        setStatus(result.message, false);
    } else {
        setStatus(result.message, true);
    }
};

const services = [
    { icon: '👥', title: 'Resident Services', copy: 'Request barangay documents, certificates, and clearances online.' },
    { icon: '🗓', title: 'Appointments & Facilities', copy: 'Schedule meetings and reserve community facilities easily.' },
    { icon: '🔔', title: 'Real-Time Announcements', copy: 'Stay updated with barangay news, advisories, and public information.' },
    { icon: '🛡', title: 'Incident Reporting', copy: 'Submit complaints and track resolution progress.' },
    { icon: '📍', title: 'Disaster Management', copy: 'Receive emergency alerts and access support information.' },
    { icon: '🏢', title: 'Community Hub', copy: 'Connect with your barangay and access essential services.' }
];

const announcements = [
    { title: 'Community Cleanup Drive', copy: 'Saturday, 7:00 AM at the covered court assembly area. Volunteers are encouraged to register in advance.' },
    { title: 'Document Request Window', copy: 'Certificate processing runs from 8:00 AM to 4:00 PM on weekdays with pickup notices posted inside the portal.' },
    { title: 'Facility Booking Reminder', copy: 'Residents are advised to check available slots before sending reservation requests for the multi-purpose hall.' }
];

onMounted(() => {
    console.log('[LandingApp] onMounted hook called');

        loadRecaptcha().catch(() => {
        // The register flow will show a visible error if the script never becomes available.
    });
    
    const pendingEmail = getPendingOtpEmail();
    if (pendingEmail) {
        otpForm.email = pendingEmail;
        console.log('[LandingApp] Restored pending OTP email:', pendingEmail);
    }

    const hasReset = hydrateResetPasswordFromUrl();
    if (hasReset) {
        setStatus('Create a new password to finish resetting your account.', false);
    }
    
    console.log('[LandingApp] Preloading hero background image');
    const img = new Image();
    img.src = '/images/hero-bg.jpg';
    img.onload = () => {
        console.log('[LandingApp] ✓ Hero image loaded successfully');
    };
    img.onerror = () => {
        console.log('[LandingApp] ℹ Hero image not found, fallback color will be used');
    };
    
    console.log('[LandingApp] Preloading fonts');
    if (document.fonts && document.fonts.load) {
        try {
            document.fonts.load('600 24px Fraunces');
            document.fonts.load('400 16px Manrope');
            console.log('[LandingApp] ✓ Fonts preload initiated');
        } catch (e) {
            console.log('[LandingApp] Font preload error (non-critical):', e.message);
        }
    }
    
    console.log('[LandingApp] ✓ Component fully initialized and visible');
});

</script>

<style scoped>
/* Highly Attractive Modern Split Auth Modal Styles */

.auth-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(16, 12, 10, 0.4);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.auth-modal-container {
    display: flex;
    background: #ffffff;
    border-radius: 28px;
    border: 1px solid rgba(22, 36, 26, 0.08);
    box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.35);
    width: 100%;
    max-width: 900px;
    min-height: 550px;
    max-height: calc(100vh - 40px);
    position: relative;
    overflow: hidden;
    transition: max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.auth-modal-container.is-register {
    max-width: 1100px;
}

.auth-modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f5f5f5;
    color: #1a1a1a;
    font-size: 1.2rem;
    border: none;
    cursor: pointer;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.auth-modal-close:hover {
    background: #1a1a1a;
    color: white;
    transform: rotate(90deg) scale(1.1);
}

/* Left Visual Side (Image/Branding) */
.auth-modal-visual {
    flex: 0 0 400px;
    background: url('/images/hero-bg.jpg') center/cover no-repeat;
    position: relative;
    display: flex;
    padding: 40px;
    flex-direction: column;
    justify-content: flex-end;
}

.visual-overlay {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(90deg, rgba(82, 12, 12, 0.8), rgba(16, 82, 36, 0.95)),
        linear-gradient(180deg, rgba(190, 0, 5, 0.3) 0%, rgba(16, 82, 36, 0.95) 100%);
    backdrop-filter: blur(2px);
    z-index: 1;
}

.visual-content {
    position: relative;
    z-index: 2;
    color: white;
}

.visual-text {
    margin-top: auto;
    padding-top: 40px;
}

.visual-text h3 {
    font-family: "Fraunces", serif;
    font-size: 2.2rem;
    line-height: 1.1;
    margin-bottom: 15px;
    color: #ffffff;
}

.visual-text p {
    font-size: 1.05rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);
}

/* Right Form Side */
.auth-modal-form-area {
    flex: 1;
    padding: 50px 60px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    position: relative;
    height: 100%;
    min-height: 0;
    max-height: 90vh;
    overflow-y: auto;
}

.form-transition-wrapper {
    width: 100%;
}

.form-header {
    margin-bottom: 36px;
}

.form-header h2 {
    font-family: inherit;
    font-size: 2rem;
    color: #1a1a1a;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
}

.auth-toggle {
    font-size: 0.95rem;
    color: #5e6f66;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 12px;
}

.toggle-text {
    display: inline;
}

.toggle-link {
    background: none;
    border: none;
    padding: 0;
    font-weight: 600;
    color: #16241a;
    cursor: pointer;
    font-size: inherit;
    text-decoration: underline;
    text-decoration-color: rgba(22, 36, 26, 0.3);
    text-underline-offset: 4px;
    transition: all 0.2s;
    display: inline;
    white-space: nowrap;
}

.toggle-link:hover {
    color: #a41c1c;
    text-decoration-color: #a41c1c;
}

.modern-form {
    display: grid;
    gap: 22px;
}

.two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.input-group label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a1a;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-wrapper > i {
    position: absolute;
    left: 16px;
    color: #8b9d93;
    font-size: 1.1rem;
    pointer-events: none;
}

.input-wrapper input {
    padding-left: 44px !important;
}

.input-wrapper.has-toggle input {
    padding-right: 48px !important;
}

.password-toggle-btn {
    position: absolute;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #5e6f66;
    display: grid;
    place-items: center;
    transition: all 0.2s ease;
}

.password-toggle-btn i {
    position: static;
    color: #415349 !important;
    font-size: 1rem;
    pointer-events: none;
}

.password-toggle-btn:hover {
    background: #e8eeea;
    color: #16241a;
}

.password-rules {
    grid-column: 1 / -1;
    border-radius: 14px;
    border: 1px solid #e2e8e5;
    background: #f8faf9;
    padding: 12px 14px;
}

.password-rules-title {
    margin: 0 0 8px;
    font-size: 0.86rem;
    color: #4f5f56;
    font-weight: 600;
}

.password-rules-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
}

.password-rule-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.86rem;
}

.password-rule-item.is-fail {
    color: #c53a3a;
}

.password-rule-item.is-pass {
    color: #2c8a4e;
}

.input-group input, 
.input-group select {
    width: 100%;
    border-radius: 14px;
    border: 2px solid #e2e8e5;
    background: #f8faf9;
    padding: 15px 18px;
    font-size: 1rem;
    color: #1a1a1a;
    transition: all 0.3s ease;
    font-family: inherit;
}

.input-group input:hover,
.input-group select:hover {
    background: #f0f4f2;
}

.input-group input:focus,
.input-group select:focus {
    background: #ffffff;
    border-color: #1a1a1a;
    outline: none;
    box-shadow: 0 0 0 4px rgba(22, 36, 26, 0.08);
}

.custom-select {
    position: relative;
}

.custom-select i {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: #8b9d93;
    pointer-events: none;
}

.custom-select select {
    appearance: none;
    -webkit-appearance: none;
}

/* File Upload Beauty */
.file-upload-group {
    grid-column: 1 / -1;
}
.file-upload-wrapper {
    position: relative;
    border: 2px dashed #cbd5d0;
    padding: 20px;
    border-radius: 14px;
    background: #f8faf9;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s;
}
.file-upload-wrapper:hover {
    border-color: #1a1a1a;
    background: #f0f4f2;
}
.file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
}
.upload-btn {
    background: #1a1a1a;
    color: white;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    pointer-events: none;
}
.file-name {
    color: #5e6f66;
    font-size: 0.95rem;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}

.recaptcha-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0;
    grid-column: 1 / -1;
    width: 100%;
    min-height: 78px;
}

.recaptcha-shell {
    display: grid;
    gap: 8px;
    grid-column: 1 / -1;
}

.recaptcha-loading {
    margin: 0;
    text-align: center;
    font-size: 0.9rem;
    color: #5e6f66;
}

.legal-text {
    text-align: center;
    font-size: 0.8rem;
    color: #8b9d93;
    grid-column: 1 / -1;
    margin-bottom: 6px;
}

.legal-text a {
    color: #5e6f66;
    font-weight: 600;
}

/* Primary Form Submit Button */
.auth-submit-btn {
    background: linear-gradient(135deg, #16241a, #2a4531);
    color: white;
    border: none;
    padding: 18px 24px;
    border-radius: 14px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.3s ease;
    grid-column: 1 / -1;
    box-shadow: 0 8px 20px rgba(22, 36, 26, 0.2);
}

.auth-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(22, 36, 26, 0.3);
    background: linear-gradient(135deg, #101c13, #1e3323);
}

.auth-submit-btn i {
    font-size: 1.1rem;
    transition: transform 0.3s;
}

.auth-submit-btn:hover i {
    transform: translateX(4px);
}

.auth-secondary-btn {
    background: transparent;
    color: #5e6f66;
    border: 2px solid #e2e8e5;
    padding: 16px 24px;
    border-radius: 14px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    grid-column: 1 / -1;
}

.auth-secondary-btn:hover {
    background: #f0f4f2;
    border-color: #cbd5d0;
    color: #1a1a1a;
}

/* OTP Specific */
.otp-instruction {
    text-align: center;
    color: #5e6f66;
    line-height: 1.6;
    margin-bottom: 10px;
}
.otp-input {
    text-align: center;
    font-size: 2rem !important;
    letter-spacing: 12px;
    padding: 20px !important;
    font-family: monospace;
    font-weight: bold;
}

/* Slide Transition Between Forms */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(15px);
}
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-15px);
}

/* Responsive */
@media (max-width: 900px) {
    .auth-modal-backdrop {
        align-items: flex-start;
    }

    .auth-modal-container {
        flex-direction: column;
        max-width: 540px !important;
        max-height: calc(100vh - 40px);
        margin: auto;
    }

    .auth-modal-visual {
        display: flex;
        flex: 0 0 auto;
        min-height: 180px;
        padding: 22px 22px 18px;
        justify-content: flex-end;
    }

    .visual-content {
        width: 100%;
    }

    .visual-text {
        padding-top: 16px;
    }

    .visual-text h3 {
        font-size: 1.55rem;
        margin-bottom: 10px;
    }

    .visual-text p {
        font-size: 0.95rem;
    }

    .auth-modal-form-area {
        padding: 34px 24px 30px;
        max-height: none;
    }

    .two-col-grid {
        grid-template-columns: 1fr;
        gap: 22px;
    }
}
@media (max-width: 480px) {
    .auth-modal-container {
        max-height: calc(100vh - 20px);
        border-radius: 22px;
    }

    .modern-form {
        gap: 18px;
    }

    .input-group {
        min-width: 0;
        overflow: hidden;
    }

    .input-group input,
    .input-group select {
        font-size: 16px;
        padding: 12px 14px;
    }

    .input-wrapper input {
        padding-left: 40px !important;
    }

    .auth-modal-visual {
        min-height: 150px;
        padding: 18px;
    }

    .visual-text h3 {
        font-size: 1.35rem;
    }

    .visual-text p {
        font-size: 0.9rem;
        line-height: 1.5;
    }

    .auth-modal-form-area {
        padding: 26px 18px 24px;
    }
    .form-header h2 {
        font-size: 1.8rem;
    }
    .auth-modal-backdrop {
        padding: 10px;
    }
}
</style>
