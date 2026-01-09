const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with robust configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    },
    timeout: 60000,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    debug: true,
    logger: true
  });
};

// Modern email template for OTP
const createOTPEmailTemplate = (otp, type = 'registration') => {
  const isRegistration = type === 'registration';
  const title = isRegistration ? 'Welcome to Joota Junction!' : 'Password Reset Request';
  const subtitle = isRegistration ? 'Verify your email to complete registration' : 'Reset your password securely';
  const expiryTime = isRegistration ? '5 minutes' : '10 minutes';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">
                    👟 Joota Junction
                </h1>
                <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                    Your Premium Footwear Destination
                </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #2d3748; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">
                    ${title}
                </h2>
                <p style="color: #718096; margin: 0 0 30px 0; font-size: 16px; line-height: 1.5;">
                    ${subtitle}
                </p>
                
                ${isRegistration ? `
                <p style="color: #4a5568; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                    Thank you for choosing Joota Junction! To complete your registration and start exploring our premium collection of footwear, please verify your email address using the OTP below:
                </p>
                ` : `
                <p style="color: #4a5568; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password. If you made this request, please use the OTP below to proceed with resetting your password:
                </p>
                `}
                
                <!-- OTP Box -->
                <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px dashed #cbd5e0; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #2d3748; margin: 0 0 15px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        Your Verification Code
                    </p>
                    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                        <span style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${otp}
                        </span>
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                        📋 Instructions:
                    </h3>
                    <ul style="color: #4a5568; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                        <li>Enter this 6-digit code in the verification form</li>
                        <li>This code will expire in <strong>${expiryTime}</strong></li>
                        <li>Do not share this code with anyone</li>
                        ${!isRegistration ? '<li>If you didn\'t request this, please ignore this email</li>' : ''}
                    </ul>
                </div>
                
                <!-- Security Notice -->
                <div style="background-color: #fed7d7; border: 1px solid #feb2b2; border-radius: 8px; padding: 15px; margin: 25px 0;">
                    <p style="color: #c53030; margin: 0; font-size: 14px; font-weight: 500;">
                        🔒 <strong>Security Notice:</strong> Joota Junction will never ask for your password or OTP via email or phone. Keep your credentials secure.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #2d3748; padding: 30px; text-align: center;">
                <p style="color: #a0aec0; margin: 0 0 15px 0; font-size: 14px;">
                    Need help? Contact our support team
                </p>
                <div style="margin: 15px 0;">
                    <a href="mailto:support@jootajunction.com" style="color: #667eea; text-decoration: none; font-weight: 500; margin: 0 15px;">
                        📧 Email Support
                    </a>
                    <span style="color: #718096;">|</span>
                    <a href="https://jootajunction.com" style="color: #667eea; text-decoration: none; font-weight: 500; margin: 0 15px;">
                        🌐 Visit Website
                    </a>
                </div>
                <div style="border-top: 1px solid #4a5568; margin: 20px 0; padding-top: 20px;">
                    <p style="color: #718096; margin: 0; font-size: 12px;">
                        © 2026 Joota Junction. All rights reserved.<br>
                        This email was sent to verify your identity. Please do not reply to this email.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Send OTP email with retry logic
const sendOTPEmail = async (recipientEmail, otp, type = 'registration', maxRetries = 3) => {
  const transporter = createTransporter();
  
  const subject = type === 'registration' 
    ? '🔐 Verify Your Email - Joota Junction Registration'
    : '🔑 Password Reset OTP - Joota Junction';
    
  const mailOptions = {
    from: {
      name: 'Joota Junction',
      address: process.env.EMAIL_USER
    },
    to: recipientEmail,
    subject: subject,
    html: createOTPEmailTemplate(otp, type),
    priority: 'high'
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Sending ${type} OTP to ${recipientEmail} (Attempt ${attempt}/${maxRetries})`);
      console.log(`🔑 Generated OTP: ${otp}`);
      
      const info = await transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully!`);
      console.log(`📨 Message ID: ${info.messageId}`);
      console.log(`📬 Accepted: ${info.accepted}`);
      console.log(`❌ Rejected: ${info.rejected}`);
      
      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      };
      
    } catch (error) {
      console.error(`❌ Email attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('🚨 All email attempts failed. Final error details:', {
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode,
          errno: error.errno,
          syscall: error.syscall
        });
        
        throw new Error(`Failed to send OTP email after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Progressive delay: 2s, 4s, 6s...
      const delay = attempt * 2000;
      console.log(`⏳ Waiting ${delay/1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Generate secure OTP
const generateSecureOTP = () => {
  // Use crypto for better randomness if available
  try {
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(3);
    const otp = (parseInt(randomBytes.toString('hex'), 16) % 900000) + 100000;
    return otp.toString();
  } catch (error) {
    // Fallback to Math.random
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
};

// Test email configuration
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    
    console.log('🔧 Testing email configuration...');
    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('🔑 Password Length:', process.env.EMAIL_PASSWORD?.length);
    
    const isValid = await transporter.verify();
    
    if (isValid) {
      console.log('✅ Email configuration is valid and ready!');
      return true;
    } else {
      console.log('❌ Email configuration validation failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  generateSecureOTP,
  testEmailConfiguration
};