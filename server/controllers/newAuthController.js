const User = require('../models/User');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const { sendOTPEmail, generateSecureOTP, testEmailConfiguration } = require('../services/newEmailService');

// Test email configuration endpoint
const testEmail = async (req, res) => {
  try {
    console.log('🧪 Testing email configuration...');
    
    const isValid = await testEmailConfiguration();
    
    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Email configuration is working properly',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email configuration test failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Generate OTP for registration
const generateRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🚀 Registration OTP request received');
    console.log('📧 Email:', email);
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    
    if (!emailRegex.test(normalizedEmail)) {
      console.log('❌ Invalid email format:', normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('❌ User already exists:', normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Generate secure OTP
    const otp = generateSecureOTP();
    console.log('🔑 Generated OTP:', otp);
    
    // Delete any existing registration OTP for this email
    await Otp.deleteMany({ email: normalizedEmail, type: 'registration' });
    console.log('🗑️ Cleared existing registration OTPs');
    
    // Save new OTP to database
    const otpRecord = await Otp.create({
      email: normalizedEmail,
      otp: otp,
      type: 'registration'
    });
    
    console.log('💾 OTP saved to database:', otpRecord._id);
    
    // Send OTP email
    const emailResult = await sendOTPEmail(normalizedEmail, otp, 'registration');
    
    console.log('✅ Registration OTP process completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email',
      email: normalizedEmail,
      messageId: emailResult.messageId,
      expiresIn: '5 minutes',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in generateRegistrationOTP:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate and send OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Verify OTP and register user
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, password, otp, name } = req.body;
    
    console.log('🔍 OTP verification request received');
    console.log('📧 Email:', email);
    console.log('🔑 OTP:', otp);
    
    // Validate input
    if (!email || !password || !otp || !name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (email, password, otp, name)'
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Validate name
    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }
    
    // Find OTP record
    const otpRecord = await Otp.findOne({ 
      email: normalizedEmail, 
      type: 'registration' 
    });
    
    if (!otpRecord) {
      console.log('❌ No OTP found for email:', normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email. Please generate a new OTP.'
      });
    }
    
    // Check if OTP has expired
    if (otpRecord.isExpired()) {
      console.log('⏰ OTP expired for email:', normalizedEmail);
      await Otp.deleteOne({ email: normalizedEmail, type: 'registration' });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please generate a new OTP.'
      });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp.trim()) {
      console.log('❌ Invalid OTP provided for email:', normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    console.log('✅ OTP verified successfully');
    
    // Create new user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: 'user',
      emailVerified: true
    });
    
    console.log('👤 User created successfully:', user._id);
    
    // Delete the used OTP
    await Otp.deleteOne({ email: normalizedEmail, type: 'registration' });
    console.log('🗑️ Used OTP deleted');
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('🎫 JWT token generated');
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified
      },
      token,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in verifyOTPAndRegister:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP and register user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Generate OTP for forgot password
const generateForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 Forgot password OTP request received');
    console.log('📧 Email:', email);
    
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (!existingUser) {
      console.log('❌ User not found:', normalizedEmail);
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }
    
    // Generate secure OTP
    const otp = generateSecureOTP();
    console.log('🔑 Generated forgot password OTP:', otp);
    
    // Delete any existing forgot password OTP for this email
    await Otp.deleteMany({ email: normalizedEmail, type: 'forgot-password' });
    console.log('🗑️ Cleared existing forgot password OTPs');
    
    // Save new OTP to database
    const otpRecord = await Otp.create({
      email: normalizedEmail,
      otp: otp,
      type: 'forgot-password'
    });
    
    console.log('💾 Forgot password OTP saved to database:', otpRecord._id);
    
    // Send OTP email
    const emailResult = await sendOTPEmail(normalizedEmail, otp, 'forgot-password');
    
    console.log('✅ Forgot password OTP process completed successfully');
    
    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent successfully to your email',
      email: normalizedEmail,
      messageId: emailResult.messageId,
      expiresIn: '10 minutes',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in generateForgotPasswordOTP:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate and send password reset OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Verify forgot password OTP
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('🔍 Forgot password OTP verification request received');
    console.log('📧 Email:', email);
    console.log('🔑 OTP:', otp);
    
    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find OTP record
    const otpRecord = await Otp.findOne({ 
      email: normalizedEmail, 
      type: 'forgot-password' 
    });
    
    if (!otpRecord) {
      console.log('❌ No forgot password OTP found for email:', normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'No password reset OTP found for this email. Please generate a new OTP.'
      });
    }
    
    // Check if OTP has expired
    if (otpRecord.isExpired()) {
      console.log('⏰ Forgot password OTP expired for email:', normalizedEmail);
      await Otp.deleteOne({ email: normalizedEmail, type: 'forgot-password' });
      return res.status(400).json({
        success: false,
        message: 'Password reset OTP has expired. Please generate a new OTP.'
      });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp.trim()) {
      console.log('❌ Invalid forgot password OTP provided for email:', normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    console.log('✅ Forgot password OTP verified successfully');
    
    res.status(200).json({
      success: true,
      message: 'Password reset OTP verified successfully. You can now reset your password.',
      email: normalizedEmail,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in verifyForgotPasswordOTP:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to verify password reset OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    console.log('🔄 Password reset request received');
    console.log('📧 Email:', email);
    
    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Validate password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }
    
    // Find and verify OTP
    const otpRecord = await Otp.findOne({ 
      email: normalizedEmail, 
      type: 'forgot-password' 
    });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No valid password reset OTP found. Please generate a new OTP.'
      });
    }
    
    if (otpRecord.isExpired()) {
      await Otp.deleteOne({ email: normalizedEmail, type: 'forgot-password' });
      return res.status(400).json({
        success: false,
        message: 'Password reset OTP has expired. Please generate a new OTP.'
      });
    }
    
    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }
    
    // Find user and update password
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update password (will be hashed by User model middleware)
    user.password = newPassword;
    await user.save();
    
    console.log('🔐 Password updated successfully for user:', user._id);
    
    // Delete the used OTP
    await Otp.deleteOne({ email: normalizedEmail, type: 'forgot-password' });
    console.log('🗑️ Used forgot password OTP deleted');
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in resetPassword:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  testEmail,
  generateRegistrationOTP,
  verifyOTPAndRegister,
  generateForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword
};