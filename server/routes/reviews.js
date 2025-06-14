const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createReview, getProductReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');

// Multer config for multiple image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/reviews');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Create a review
router.post('/', protect, upload.array('images', 5), createReview);

// Get all reviews for a product
router.get('/:productId', getProductReviews);

// Get user's reviews
router.get('/user', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .select('product')
      .lean();
    
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching reviews',
      error: error.message 
    });
  }
});

module.exports = router; 