const express = require('express');
const router = express.Router();
const {
  testEmail,
  generateRegistrationOTP,
  verifyOTPAndRegister,
  generateForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword
} = require('../controllers/newAuthController');

// Test email configuration
router.get('/test-email', testEmail);

// Registration flow
router.post('/generate-otp', generateRegistrationOTP);
router.post('/verify-otp', verifyOTPAndRegister);

// Forgot password flow
router.post('/forgot-password', generateForgotPasswordOTP);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOTP);
router.post('/reset-password', resetPassword);

module.exports = router;