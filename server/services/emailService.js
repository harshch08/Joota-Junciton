const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  timeout: 30000, // 30 seconds timeout
  connectionTimeout: 30000, // 30 seconds connection timeout
  greetingTimeout: 30000, // 30 seconds greeting timeout
  socketTimeout: 30000, // 30 seconds socket timeout
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
    console.error('Email User:', process.env.EMAIL_USER);
    console.error('Email Password length:', process.env.EMAIL_PASSWORD?.length);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

const sendOtpEmail = async (recipientEmail, otp, retries = 3) => {
  const mailOptions = {
    from: {
      name: 'Joota Junction',
      address: process.env.EMAIL_USER
    },
    to: recipientEmail,
    subject: 'Your OTP for Joota Junction Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">Joota Junction</h1>
        </div>
        <h2 style="color: #333;">Email Verification</h2>
        <p>Thank you for registering with Joota Junction. Your OTP for email verification is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666;">This OTP will expire in 5 minutes.</p>
        <p style="color: #666;">If you didn't request this OTP, please ignore this email.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
          <p>Best regards,<br>Team Joota Junction</p>
        </div>
      </div>
    `
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting to send OTP email to: ${recipientEmail} (Attempt ${attempt}/${retries})`);
      console.log('Using email service:', process.env.EMAIL_USER);
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('All email attempts failed. Final error:', {
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode
        });
        throw new Error('Failed to send OTP email after multiple attempts');
      }
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

const sendForgotPasswordEmail = async (recipientEmail, otp) => {
  const mailOptions = {
    from: {
      name: 'Joota Junction',
      address: process.env.EMAIL_USER
    },
    to: recipientEmail,
    subject: 'Password Reset OTP - Joota Junction',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #333;">Joota Junction</h1>
        </div>
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>We received a request to reset your password for your Joota Junction account. Your OTP for password reset is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666;">This OTP will expire in 10 minutes.</p>
        <p style="color: #666;">If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
          <p>Best regards,<br>Team Joota Junction</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Forgot password email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    throw new Error('Failed to send forgot password email');
  }
};

module.exports = {
  sendOtpEmail,
  sendForgotPasswordEmail
}; 