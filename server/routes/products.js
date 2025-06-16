const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');
const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const { productUpload } = require('../config/cloudinary');

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
    
    const { category, brand, brandId, minPrice, maxPrice, search, sortBy } = req.query;
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
    
    // Determine sort options
    let sortOptions = {};
    if (sortBy) {
      switch (sortBy) {
        case 'price-low':
          sortOptions = { price: 1 };
          break;
        case 'price-high':
          sortOptions = { price: -1 };
          break;
        case 'newest':
        default:
          sortOptions = { createdAt: -1 };
          break;
      }
    } else {
      sortOptions = { createdAt: -1 }; // Default sort by newest
    }
    
    const products = await Product.find(query).sort(sortOptions);
    
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

// Create a new product (admin only)
router.post('/', protect, admin, productUpload.array('images', 5), async (req, res) => {
  try {
    const { name, brand, category, price, discountedPrice, description, sizes, featured } = req.body;
    
    // Get Cloudinary URLs from uploaded files
    const images = req.files.map(file => file.path);
    
    const product = new Product({
      name,
      brand,
      category,
      price,
      discountedPrice: discountedPrice || undefined,
      description,
      images,
      sizes: JSON.parse(sizes),
      featured: featured === 'true'
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
});

// Update a product (admin only)
router.put('/:id', protect, admin, productUpload.array('images', 5), async (req, res) => {
  try {
    const { name, brand, category, price, discountedPrice, description, sizes, featured } = req.body;
    const updateData = {
      name,
      brand,
      category,
      price,
      discountedPrice: discountedPrice || undefined,
      description,
      sizes: JSON.parse(sizes),
      featured: featured === 'true'
    };

    // If new images are uploaded, update the images array
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
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