const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');
const Brand = require('../models/Brand');

// Debug middleware
router.use((req, res, next) => {
  console.log('Products Route:', {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    console.log('GET /api/products/featured - Fetching featured products');
    const products = await Product.find({ featured: true });
    console.log(`Found ${products.length} featured products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/products - Fetching all products');
    console.log('Request headers:', req.headers);
    console.log('Request query:', req.query);
    
    const { category, brand, brandId, minPrice, maxPrice, search } = req.query;
    let query = {};

    // Apply filters
    if (category && category !== 'all') {
      query.category = category;
    }
    if (brand) {
      query.brand = brand;
    }
    if (brandId) {
      // First get the brand name from the brand ID
      const brandDoc = await Brand.findById(brandId);
      if (brandDoc) {
        query.brand = brandDoc.name;
      }
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    
    const products = await Product.find(query);
    console.log(`Found ${products.length} products`);
    
    // Log the first product as a sample
    if (products.length > 0) {
      console.log('Sample product:', JSON.stringify(products[0], null, 2));
    }
    
    res.json(products);
  } catch (error) {
    console.error('Detailed error in GET /api/products:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      query: error.query,
      operation: error.operation
    });
    res.status(500).json({ 
      message: 'Error fetching products',
      error: error.message,
      code: error.code
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create product (admin only)
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update product (admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 