const axios = require('axios');

const API_BASE_URL = process.env.VITE_API_URL || 'https://jjunction-backend-55hr.onrender.com';

// Test email - replace with a real email for testing
const TEST_EMAIL = 'test@example.com';

async function testForgotPasswordFlow() {
  try {
    console.log('🧪 Testing Forgot Password Flow...\n');

    // Step 1: Generate Forgot Password OTP
    console.log('1️⃣ Generating forgot password OTP...');
    const otpResponse = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    console.log('✅ OTP generation response:', otpResponse.data);

    // Note: In a real test, you would need to check the email for the OTP
    // For this test, we'll assume the OTP is '123456' (you'll need to replace this with the actual OTP)
    const testOtp = '123456'; // Replace with actual OTP from email

    // Step 2: Verify OTP
    console.log('\n2️⃣ Verifying OTP...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/api/auth/verify-forgot-password-otp`, {
      email: TEST_EMAIL,
      otp: testOtp
    });
    console.log('✅ OTP verification response:', verifyResponse.data);

    // Step 3: Reset Password
    console.log('\n3️⃣ Resetting password...');
    const resetResponse = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
      email: TEST_EMAIL,
      otp: testOtp,
      newPassword: 'newpassword123'
    });
    console.log('✅ Password reset response:', resetResponse.data);

    console.log('\n🎉 Forgot password flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testForgotPasswordFlow(); 