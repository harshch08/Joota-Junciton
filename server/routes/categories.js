const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/admin');

// Get all categories
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/categories - Fetching all categories');
    
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    console.log(`Found ${categories.length} categories`);
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      message: 'Error fetching categories',
      error: error.message 
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`GET /api/categories/${req.params.id} - Fetching category`);
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      message: 'Error fetching category',
      error: error.message 
    });
  }
});

// Create new category (Admin only)
router.post('/', protect, adminProtect, async (req, res) => {
  try {
    console.log('POST /api/categories - Creating new category');
    console.log('Request body:', req.body);
    
    const { name, description, image } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ 
        message: 'Name and description are required' 
      });
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category with this name already exists' 
      });
    }
    
    const category = await Category.create({
      name,
      description,
      image: image || null
    });
    
    console.log('Category created successfully:', category._id);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Error creating category',
      error: error.message 
    });
  }
});

// Update category (Admin only)
router.put('/:id', protect, adminProtect, async (req, res) => {
  try {
    console.log(`PUT /api/categories/${req.params.id} - Updating category`);
    console.log('Request body:', req.body);
    
    const { name, description, image, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if name is being changed and if it conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          message: 'Category with this name already exists' 
        });
      }
    }
    
    // Update fields
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    
    console.log('Category updated successfully:', category._id);
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Error updating category',
      error: error.message 
    });
  }
});

// Delete category (Admin only) - Soft delete by setting isActive to false
router.delete('/:id', protect, adminProtect, async (req, res) => {
  try {
    console.log(`DELETE /api/categories/${req.params.id} - Soft deleting category`);
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Soft delete by setting isActive to false
    category.isActive = false;
    await category.save();
    
    console.log('Category soft deleted successfully:', category._id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      message: 'Error deleting category',
      error: error.message 
    });
  }
});

module.exports = router; 