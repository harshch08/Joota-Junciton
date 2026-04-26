const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { login, register, resetPassword } = require('../controllers/authController');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login
router.post('/login', login);

// Register (direct, no OTP)
router.post('/register', register);

// Reset password (direct, no OTP)
router.post('/reset-password', resetPassword);

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('cart.productId', 'name price discountedPrice images brand description');

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

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        avatar: picture,
        googleId: payload.sub,
        password: Math.random().toString(36).slice(-8)
      });
    }

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
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Invalid request format' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cart = items.map(item => ({
      productId: item.productId,
      size: item.size,
      quantity: item.quantity || 1
    }));

    await user.save();
    await user.populate('cart.productId', 'name price discountedPrice images brand description');
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

module.exports = router;
