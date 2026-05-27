const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const { register, login, getMe, verifyOtp, resendOtp, forgotPassword, resetPassword, changePassword, requestAdminEmailChange, confirmAdminEmailChange } = require('../controllers/authController');

const registerLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    scope: 'auth:register',
    message: 'Too many registration attempts. Please try again later.'
});
const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    scope: 'auth:login',
    message: 'Too many login attempts. Please try again later.'
});
const otpLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 8,
    scope: 'auth:otp',
    message: 'Too many OTP attempts. Please try again later.'
});
const passwordResetLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    scope: 'auth:password-reset',
    message: 'Too many password reset attempts. Please try again later.'
});

router.post('/register', registerLimiter, upload.fields([
    { name: 'proofOfResidency', maxCount: 1 }
]), register);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/change-password', authMiddleware, passwordResetLimiter, changePassword);
router.post('/admin/email-change-request', authMiddleware, roleMiddleware('admin'), passwordResetLimiter, requestAdminEmailChange);
router.post('/admin/email-change-confirm', passwordResetLimiter, confirmAdminEmailChange);
router.get('/me', authMiddleware, getMe);

module.exports = router;
