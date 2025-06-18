const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateOtp, verifyOtpAndRegister, login, generateForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } = require('../controllers/authController');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log('Missing fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    console.log('Creating new user:', { name, email });
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('User created successfully:', user._id);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        cart: user.cart
      }
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating user' });
  }
});

// Login user
router.post('/login', login);

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('cart.productId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google Authentication
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        email,
        name,
        avatar: picture,
        googleId: payload.sub,
        password: Math.random().toString(36).slice(-8) // Random password for Google users
      });
    }

    // Generate JWT token
    const authToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      token: authToken
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

// Update cart
router.post('/cart', protect, async (req, res) => {
  try {
    console.log('Cart update request:', req.body);
    const { items } = req.body;
    
    if (!Array.isArray(items)) {
      console.log('Invalid items format:', items);
      return res.status(400).json({ message: 'Invalid request format' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Current cart:', user.cart);
    console.log('New items:', items);

    // Update cart with new items
    user.cart = items.map(item => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity || 1
    }));

    await user.save();
    console.log('Updated cart:', user.cart);
    
    // Populate product details before sending response
    await user.populate('cart.productId');
    res.json(user.cart);
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
router.delete('/cart', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate OTP
router.post('/generate-otp', generateOtp);

// Verify OTP and register
router.post('/verify-otp', verifyOtpAndRegister);

// Forgot Password Routes
router.post('/forgot-password', generateForgotPasswordOtp);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/reset-password', resetPassword);

module.exports = router; 