const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { productId, orderId, message, rating } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : [];

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this product'
      });
    }

    const review = await Review.create({
      product: productId,
      user: req.user.id,
      order: orderId,
      message,
      rating,
      images
    });

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      message: 'Error fetching reviews',
      error: error.message
    });
  }
}; 