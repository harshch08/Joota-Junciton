const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { reviewUpload } = require('../config/cloudinary');
const Review = require('../models/Review');
const Product = require('../models/Product');

// Create a review
router.post('/', protect, reviewUpload.array('images', 5), async (req, res) => {
  try {
    const { productId, orderId, message, rating } = req.body;
    
    // Get Cloudinary URLs from uploaded files
    const images = req.files ? req.files.map(file => file.path) : [];
    
    const review = new Review({
      product: productId,
      user: req.user._id,
      order: orderId,
      images,
      message,
      rating
    });

    await review.save();

    // Update product rating
    const product = await Product.findById(productId);
    const reviews = await Review.find({ product: productId });
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    product.rating = averageRating;
    await product.save();

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
});

// Delete a review
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the review author
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.id);

    // Update product rating
    const product = await Product.findById(review.product);
    const reviews = await Review.find({ product: review.product });
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      product.rating = averageRating;
    } else {
      product.rating = 0;
    }
    
    await product.save();

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
});

module.exports = router; 