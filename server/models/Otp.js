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
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // 5 minutes in seconds
  }
});

// Add index for faster queries
otpSchema.index({ email: 1, createdAt: -1 });

// Add method to check if OTP is expired
otpSchema.methods.isExpired = function() {
  return (Date.now() - this.createdAt.getTime()) > 300000; // 5 minutes in milliseconds
};

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp; 