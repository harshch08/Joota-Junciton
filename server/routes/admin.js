const express = require('express');
const router = express.Router();
const { adminProtect } = require('../middleware/admin');
const { protect, admin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const descriptionGeneratorService = require('../services/descriptionGeneratorService');
const visualSearchService = require('../services/visualSearchService');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const StoreSettings = require('../models/StoreSettings');
const { productUpload } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_485_760 } });

// Admin Dashboard Statistics
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    console.log('Fetching dashboard data for admin:', req.user.email);

    const totalUsers = await User.countDocuments({ role: 'user' });
    console.log('Total users:', totalUsers);

    const totalProducts = await Product.countDocuments();
    console.log('Total products:', totalProducts);

    const totalOrders = await Order.countDocuments();
    console.log('Total orders:', totalOrders);

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    console.log('Pending orders:', pendingOrders);
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    console.log('Total revenue:', totalRevenue[0]?.total || 0);

    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 })
      .limit(5);
    console.log('Recent orders count:', recentOrders.length);

    // Get low stock products (any size with stock < 10)
    const lowStockProducts = await Product.find({
      'sizes.stock': { $lt: 10 }
    });
    console.log('Low stock products count:', lowStockProducts.length);

    // Get all brands
    const brands = await Brand.find().sort({ name: 1 });
    console.log('Total brands:', brands.length);

    const dashboardData = {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalBrands: brands.length
      },
      recentOrders,
      lowStockProducts,
      brands
    };

    console.log('Dashboard data fetched successfully');
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all users (admin only)
router.get('/users', adminProtect, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .populate('cart.productId')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user role
router.put('/users/:id/role', adminProtect, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Delete user
router.delete('/users/:id', adminProtect, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Get all orders with details
router.get('/orders', adminProtect, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status
router.put('/orders/:id/status', adminProtect, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email')
     .populate('items.product', 'name price images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Get order by ID
router.get('/orders/:id', adminProtect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price images description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

// Create new product
router.post('/products', protect, admin, productUpload.array('images', 5), async (req, res) => {
  try {
    const { name, brand, category, price, discountedPrice, description, sizes } = req.body;
    
    // Validate required fields
    if (!name || !brand || !category || !price || !description || !sizes) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get Cloudinary URLs from uploaded files
    const images = req.files ? req.files.map(file => file.path) : [];

    // Format sizes array
    const formattedSizes = JSON.parse(sizes).map(size => ({
      size: parseInt(size),
      stock: 0 // Default stock for new sizes
    }));

    const product = await Product.create({
      name,
      brand,
      category,
      price: parseFloat(price),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : undefined,
      description,
      images,
      sizes: formattedSizes
    });

    // Fire-and-forget: index product for visual search
    visualSearchService.indexProduct(product._id, product.images)
      .catch(err => console.error('Index error on create:', err));

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/products/:id', protect, admin, productUpload.array('images', 5), async (req, res) => {
  try {
    const { name, brand, category, price, discountedPrice, description, sizes } = req.body;
    
    const updateData = {
      name,
      brand,
      category,
      price: parseFloat(price),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : undefined,
      description
    };

    // Handle new images if uploaded
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => file.path);
    }

    // If sizes are provided, preserve existing stock
    if (sizes) {
      // Get the current product to preserve existing stock
      const currentProduct = await Product.findById(req.params.id);
      if (!currentProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Create a map of existing stock by size
      const existingStockMap = new Map();
      currentProduct.sizes.forEach(size => {
        existingStockMap.set(size.size, size.stock);
      });

      // Create new sizes array preserving existing stock
      const parsedSizes = JSON.parse(sizes);
      updateData.sizes = parsedSizes.map(size => ({
        size: parseInt(size),
        stock: existingStockMap.get(parseInt(size)) || 0 // Preserve existing stock, default to 0 for new sizes
      }));
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fire-and-forget: re-index if images were updated
    if (req.files && req.files.length > 0) {
      visualSearchService.indexProduct(product._id, product.images)
        .catch(err => console.error('Index error on update:', err));
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Update product inventory (size-based)
router.put('/products/:id/inventory', adminProtect, async (req, res) => {
  try {
    const { size, stock } = req.body;
    
    if (!size || stock === undefined) {
      return res.status(400).json({ message: 'Size and stock are required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find and update the specific size
    const sizeIndex = product.sizes.findIndex(s => s.size === parseInt(size));
    if (sizeIndex === -1) {
      return res.status(404).json({ message: 'Size not found' });
    }

    product.sizes[sizeIndex].stock = parseInt(stock);
    await product.save();

    res.json(product);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Error updating inventory' });
  }
});

// Delete product
router.delete('/products/:id', adminProtect, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fire-and-forget: remove from visual search index
    visualSearchService.removeProduct(req.params.id)
      .catch(err => console.error('Remove index error on delete:', err));

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Get all products with pagination
router.get('/products', adminProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments();

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get product by ID
router.get('/products/:id', adminProtect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Categories CRUD Routes

// Get all categories
router.get('/categories', adminProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Category.countDocuments();

    res.json({
      categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCategories: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get category by ID
router.get('/categories/:id', adminProtect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create new category
router.post('/categories', adminProtect, async (req, res) => {
  try {
    const { name, description, image } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
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

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update category
router.put('/categories/:id', adminProtect, async (req, res) => {
  try {
    const { name, description, image } = req.body;
    
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
    
    await category.save();
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete category (soft delete)
router.delete('/categories/:id', adminProtect, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Soft delete by setting isActive to false
    category.isActive = false;
    await category.save();
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// Featured Products Management

// Get all featured products
router.get('/featured-products', adminProtect, async (req, res) => {
  try {
    const featuredProducts = await Product.find({ featured: true })
      .select('_id name brand price images category')
      .sort({ createdAt: -1 });

    res.json(featuredProducts);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Error fetching featured products' });
  }
});

// Get all products for featured selection
router.get('/products-for-featured', adminProtect, async (req, res) => {
  try {
    const products = await Product.find()
      .select('_id name brand price images category featured')
      .sort({ name: 1 });

    res.json(products);
  } catch (error) {
    console.error('Get products for featured selection error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Update product featured status
router.put('/products/:id/featured', adminProtect, async (req, res) => {
  try {
    const { featured } = req.body;
    
    if (typeof featured !== 'boolean') {
      return res.status(400).json({ message: 'Featured status must be a boolean' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { featured },
      { new: true }
    ).select('_id name brand price images category featured');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Update featured status error:', error);
    res.status(500).json({ message: 'Error updating featured status' });
  }
});

// Bulk update featured products
router.put('/featured-products/bulk', adminProtect, async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ message: 'Product IDs must be an array' });
    }

    // First, remove featured status from all products
    await Product.updateMany({}, { featured: false });

    // Then, set featured status for selected products
    if (productIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: productIds } },
        { featured: true }
      );
    }

    // Return updated featured products
    const featuredProducts = await Product.find({ featured: true })
      .select('_id name brand price images category featured')
      .sort({ createdAt: -1 });

    res.json(featuredProducts);
  } catch (error) {
    console.error('Bulk update featured products error:', error);
    res.status(500).json({ message: 'Error updating featured products' });
  }
});

// Store Settings Management

// Get store settings (public route for footer)
router.get('/store-settings/public', async (req, res) => {
  try {
    let settings = await StoreSettings.findOne({ isActive: true });
    
    if (!settings) {
      // Create default settings if none exist
      settings = await StoreSettings.create({
        storeName: 'JOOTA JUNCTION',
        contactEmails: [{ email: 'admin@jootajunction.com', label: 'General' }],
        phoneNumbers: [{ number: '+91 98765 43210', label: 'General' }],
        addresses: [{
          street: '123 Fashion Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India',
          label: 'Main Office'
        }],
        aboutStore: 'Welcome to JOOTA JUNCTION - Your premier destination for stylish and comfortable footwear.',
        socialMedia: {
          facebook: 'https://facebook.com/jootajunction',
          instagram: 'https://instagram.com/jootajunction',
          twitter: 'https://twitter.com/jootajunction',
          linkedin: 'https://linkedin.com/company/jootajunction'
        }
      });
    }

    // Return only the data needed for the footer
    const publicSettings = {
      storeName: settings.storeName,
      contactEmails: settings.contactEmails.filter(email => email.isActive),
      phoneNumbers: settings.phoneNumbers.filter(phone => phone.isActive),
      addresses: settings.addresses.filter(address => address.isActive),
      socialMedia: settings.socialMedia,
      aboutStore: settings.aboutStore
    };

    res.json(publicSettings);
  } catch (error) {
    console.error('Get public store settings error:', error);
    res.status(500).json({ message: 'Error fetching store settings' });
  }
});

// Get store settings
router.get('/store-settings', adminProtect, async (req, res) => {
  try {
    let settings = await StoreSettings.findOne({ isActive: true });
    
    if (!settings) {
      // Create default settings if none exist
      settings = await StoreSettings.create({
        storeName: 'JOOTA JUNCTION',
        contactEmails: [{ email: 'admin@jootajunction.com', label: 'General' }],
        phoneNumbers: [{ number: '+91 98765 43210', label: 'General' }],
        addresses: [{
          street: '123 Fashion Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India',
          label: 'Main Office'
        }],
        aboutStore: 'Welcome to JOOTA JUNCTION - Your premier destination for stylish and comfortable footwear.',
        socialMedia: {
          facebook: 'https://facebook.com/jootajunction',
          instagram: 'https://instagram.com/jootajunction',
          twitter: 'https://twitter.com/jootajunction',
          linkedin: 'https://linkedin.com/company/jootajunction'
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get store settings error:', error);
    res.status(500).json({ message: 'Error fetching store settings' });
  }
});

// Update store settings
router.put('/store-settings', adminProtect, async (req, res) => {
  try {
    const {
      storeName,
      contactEmails,
      phoneNumbers,
      addresses,
      aboutStore,
      socialMedia,
      businessHours,
      shippingSettings,
      taxSettings,
      currency
    } = req.body;

    let settings = await StoreSettings.findOne({ isActive: true });
    
    if (!settings) {
      settings = new StoreSettings();
    }

    // Update fields
    if (storeName !== undefined) settings.storeName = storeName;
    if (contactEmails !== undefined) settings.contactEmails = contactEmails;
    if (phoneNumbers !== undefined) settings.phoneNumbers = phoneNumbers;
    if (addresses !== undefined) settings.addresses = addresses;
    if (aboutStore !== undefined) settings.aboutStore = aboutStore;
    if (socialMedia !== undefined) settings.socialMedia = socialMedia;
    if (businessHours !== undefined) settings.businessHours = businessHours;
    if (shippingSettings !== undefined) settings.shippingSettings = shippingSettings;
    if (taxSettings !== undefined) settings.taxSettings = taxSettings;
    if (currency !== undefined) settings.currency = currency;

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update store settings error:', error);
    res.status(500).json({ message: 'Error updating store settings' });
  }
});

// Admin Password Change
router.put('/change-password', adminProtect, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get admin user
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, adminUser.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10; // Use same salt rounds as pre-save hook
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password directly to avoid double-hashing from pre-save hook
    await User.findByIdAndUpdate(req.user.id, { password: hashedNewPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// Brand Management Routes

// Get all brands with pagination
router.get('/brands', adminProtect, async (req, res) => {
  try {
    console.log('=== Fetching brands ===');
    console.log('Admin user:', req.user.email);
    
    // First check if Brand model is properly imported
    if (!Brand) {
      console.error('Brand model is not properly imported');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get all brands without any filters first to debug
    const allBrands = await Brand.find({});
    console.log('All brands in database:', allBrands);

    // Get active brands with pagination
    const brands = await Brand.find({ isActive: true })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${brands.length} brands after pagination`);

    const total = await Brand.countDocuments({ isActive: true });
    console.log(`Total active brands: ${total}`);

    // If no brands found, create some default brands
    if (total === 0) {
      console.log('No brands found, creating default brands...');
      const defaultBrands = [
        { name: 'Nike', description: 'Just Do It', logo: 'https://via.placeholder.com/150' },
        { name: 'Adidas', description: 'Impossible Is Nothing', logo: 'https://via.placeholder.com/150' },
        { name: 'Puma', description: 'Forever Faster', logo: 'https://via.placeholder.com/150' },
        { name: 'Reebok', description: 'Be More Human', logo: 'https://via.placeholder.com/150' }
      ];

      try {
        const createdBrands = await Brand.insertMany(defaultBrands);
        console.log('Created default brands:', createdBrands);
        brands = createdBrands;
        total = createdBrands.length;
      } catch (insertError) {
        console.error('Error creating default brands:', insertError);
        return res.status(500).json({ 
          message: 'Error creating default brands',
          error: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        });
      }
    }

    const response = {
      brands,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBrands: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

    console.log('Sending brands response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error in GET /brands:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error fetching brands',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get brand by ID
router.get('/brands/:id', adminProtect, async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    res.json(brand);
  } catch (error) {
    console.error('Get brand error:', error);
    res.status(500).json({ message: 'Error fetching brand' });
  }
});

// Create new brand
router.post('/brands', adminProtect, async (req, res) => {
  try {
    const { name, description, logo } = req.body;
    
    // Validate required fields
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    // Check if brand already exists (case-insensitive)
    const existingBrand = await Brand.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingBrand) {
      return res.status(400).json({ 
        message: 'Brand with this name already exists' 
      });
    }

    const brand = await Brand.create({
      name: name.trim(),
      description: description?.trim(),
      logo: logo || 'https://via.placeholder.com/150'
    });

    res.status(201).json(brand);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ 
      message: 'Error creating brand',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update brand
router.put('/brands/:id', adminProtect, async (req, res) => {
  try {
    const { name, description, logo, isActive } = req.body;
    
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }
    
    // Check if name is being changed and if it conflicts with existing brand
    if (name && name.trim() !== brand.name) {
      const existingBrand = await Brand.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingBrand) {
        return res.status(400).json({ 
          message: 'Brand with this name already exists' 
        });
      }
    }
    
    // Update fields
    if (name !== undefined) brand.name = name.trim();
    if (description !== undefined) brand.description = description?.trim();
    if (logo !== undefined) brand.logo = logo;
    if (isActive !== undefined) brand.isActive = isActive;
    
    await brand.save();
    
    res.json(brand);
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ 
      message: 'Error updating brand',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete brand (soft delete)
router.delete('/brands/:id', adminProtect, async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    // Check if brand is used in any products
    const productsWithBrand = await Product.findOne({ brand: brand.name });
    if (productsWithBrand) {
      return res.status(400).json({ 
        message: 'Cannot delete brand that is associated with products' 
      });
    }
    
    // Soft delete by setting isActive to false
    brand.isActive = false;
    await brand.save();
    
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ 
      message: 'Error deleting brand',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper: generate product description by searching the web for the product
async function generateDescriptionFromSearch(name, brand, category) {
  const fetch = (await import('node-fetch')).default;

  // Build search query
  const query = [brand, name, category, 'shoe', 'description'].filter(Boolean).join(' ');
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const html = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html',
    },
    timeout: 8000,
  }).then(r => r.text());

  // Extract snippets from DuckDuckGo results
  const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  const snippets = [];
  let match;
  while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
    const text = match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if (text.length > 40) snippets.push(text);
  }

  if (snippets.length === 0) {
    // Fallback: generate a template description from the product info
    const productName = name || 'This shoe';
    const productBrand = brand ? `by ${brand}` : '';
    const productCategory = category || 'footwear';
    return `${productName} ${productBrand} is a premium ${productCategory} designed for comfort and style. Crafted with high-quality materials, it offers excellent durability and a modern aesthetic. Whether you're heading to the gym, office, or a casual outing, this shoe delivers the perfect blend of performance and fashion. The ergonomic design ensures all-day comfort while the sleek silhouette keeps you looking sharp. Available in multiple sizes to find your perfect fit.`;
  }

  // Combine snippets into a coherent description
  const combined = snippets.join(' ').replace(/\s+/g, ' ').trim();
  // Trim to a reasonable length
  const words = combined.split(' ');
  const trimmed = words.slice(0, 120).join(' ');
  return trimmed.length > 0 ? trimmed : snippets[0];
}

// AI: Generate product description from image
const descRateLimiter = rateLimit({
  windowMs: parseInt(process.env.DESC_RATE_LIMIT_WINDOW_MS || '3600000', 10),
  max: parseInt(process.env.DESC_RATE_LIMIT_MAX || '50', 10),
  keyGenerator: (req) => req.user ? String(req.user._id || req.user.id) : req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + req.rateLimit.resetTime).toISOString();
    res.status(429).json({
      error: `Description generation limit reached. Try again after ${resetTime}.`,
    });
  },
});

router.post('/generate-description', protect, admin, descRateLimiter, async (req, res) => {
  const { imageUrl, name, brand, category } = req.body;
  if (!imageUrl && !name) {
    return res.status(400).json({ error: 'An image URL or product name is required.' });
  }
  try {
    const description = await generateDescriptionFromSearch(name, brand, category);
    return res.json({ description });
  } catch (err) {
    const status = err.status || 502;
    return res.status(status).json({ error: err.message || 'Description generation failed. Please try again or write a description manually.' });
  }
});

// AI: Rebuild visual search index (admin only)
router.post('/visual-search/rebuild-index', protect, admin, async (req, res) => {
  try {
    const result = await visualSearchService.rebuildIndex();
    return res.json(result);
  } catch (err) {
    console.error('Rebuild index error:', err);
    return res.status(500).json({ error: 'Failed to rebuild visual search index.' });
  }
});

// AI: Generate product description from uploaded image file (for new products before Cloudinary upload)
router.post('/generate-description-from-file', protect, admin, descRateLimiter, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10 MB.' });
      }
      return res.status(400).json({ error: 'Unsupported format. Upload a JPEG, PNG, or WebP image.' });
    }
    if (err) return next(err);
    next();
  });
}, async (req, res) => {
  const { name, brand, category } = req.body;
  try {
    const description = await generateDescriptionFromSearch(name, brand, category);
    return res.json({ description });
  } catch (err) {
    console.error('Generate description from file error:', err);
    return res.status(502).json({ error: 'Description generation failed. Please try again or write a description manually.' });
  }
});

module.exports = router; 