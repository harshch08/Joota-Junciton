const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['registration', 'forgot-password'],
    default: 'registration'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for faster queries
otpSchema.index({ email: 1, type: 1, createdAt: -1 });

// Add method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  const expirationTime = this.type === 'forgot-password' ? 600000 : 300000; // 10 minutes for forgot-password, 5 minutes for registration
  return (Date.now() - this.createdAt.getTime()) > expirationTime;
};

// Add method to get expiration time in minutes
otpSchema.methods.getExpirationMinutes = function() {
  return this.type === 'forgot-password' ? 10 : 5;
};

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp; 