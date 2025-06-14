const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/admin');

// Get all brands (public)
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Error fetching brands' });
  }
});

// Get brand by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ message: 'Error fetching brand' });
  }
});

// Get brand by slug (public)
router.get('/slug/:slug', async (req, res) => {
  try {
    const brand = await Brand.findOne({ slug: req.params.slug, isActive: true });
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    console.error('Error fetching brand by slug:', error);
    res.status(500).json({ message: 'Error fetching brand' });
  }
});

// Create new brand (admin only)
router.post('/', protect, adminProtect, async (req, res) => {
  try {
    const { name, description, logo } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name });
    if (existingBrand) {
      return res.status(400).json({ message: 'Brand already exists' });
    }

    const brand = await Brand.create({
      name,
      description: description || '',
      logo: logo || ''
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error('Error creating brand:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating brand' });
  }
});

// Update brand (admin only)
router.put('/:id', protect, adminProtect, async (req, res) => {
  try {
    const { name, description, logo, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Check if name is being changed and if it conflicts with existing brand
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({ name, _id: { $ne: req.params.id } });
      if (existingBrand) {
        return res.status(400).json({ message: 'Brand name already exists' });
      }
    }

    brand.name = name || brand.name;
    brand.description = description !== undefined ? description : brand.description;
    brand.logo = logo !== undefined ? logo : brand.logo;
    brand.isActive = isActive !== undefined ? isActive : brand.isActive;

    await brand.save();
    res.json(brand);
  } catch (error) {
    console.error('Error updating brand:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating brand' });
  }
});

// Delete brand (admin only)
router.delete('/:id', protect, adminProtect, async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ message: 'Error deleting brand' });
  }
});

// Get all brands (admin - includes inactive)
router.get('/admin/all', protect, adminProtect, async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    res.json(brands);
  } catch (error) {
    console.error('Error fetching all brands:', error);
    res.status(500).json({ message: 'Error fetching brands' });
  }
});

module.exports = router; 