const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const Razorpay = require('razorpay');

// Razorpay instance (keys from environment variables)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Get user's orders
router.get('/', protect, async (req, res) => {
  try {
    console.log('GET /api/orders - Fetching user orders for:', req.user.id);
    
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'name price images brand description')
      .sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders for user`);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message 
    });
  }
});

// Get specific order by ID (user can only see their own orders)
router.get('/:id', protect, async (req, res) => {
  try {
    console.log(`GET /api/orders/${req.params.id} - Fetching specific order`);
    
    const order = await Order.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    }).populate('items.product', 'name price images brand description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      message: 'Error fetching order',
      error: error.message 
    });
  }
});

// Create new order
router.post('/', protect, async (req, res) => {
  try {
    console.log('POST /api/orders - Creating new order');
    console.log('Request body:', req.body);
    
    const { items, shippingAddress, paymentMethod, totalPrice, shippingPrice } = req.body;
    
    // Validate required fields
    if (!items || !shippingAddress || !paymentMethod || !totalPrice) {
      return res.status(400).json({ 
        message: 'Missing required fields' 
      });
    }

    // Validate stock availability and update inventory
    const stockValidationErrors = [];
    const inventoryUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ 
          message: `Product not found: ${item.product}` 
        });
      }

      // Find the specific size in the product
      const sizeObj = product.sizes.find(s => s.size === item.size);
      if (!sizeObj) {
        return res.status(400).json({ 
          message: `Size ${item.size} not available for product: ${product.name}` 
        });
      }

      // Check if enough stock is available
      if (sizeObj.stock < item.quantity) {
        stockValidationErrors.push({
          product: product.name,
          size: item.size,
          requested: item.quantity,
          available: sizeObj.stock
        });
      } else {
        // Prepare inventory update
        inventoryUpdates.push({
          productId: product._id,
          size: item.size,
          newStock: sizeObj.stock - item.quantity
        });
      }
    }

    // If there are stock validation errors, return them
    if (stockValidationErrors.length > 0) {
      return res.status(400).json({
        message: 'Insufficient stock for some items',
        stockErrors: stockValidationErrors
      });
    }

    // Create the order
    const order = await Order.create({
      user: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      totalPrice,
      shippingPrice: shippingPrice || 0,
      status: 'pending'
    });

    // Update inventory for all items
    for (const update of inventoryUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        {
          $set: {
            [`sizes.$[elem].stock`]: update.newStock
          }
        },
        {
          arrayFilters: [{ 'elem.size': update.size }],
          new: true
        }
      );
    }

    // Populate product details
    await order.populate('items.product', 'name price images brand description');

    console.log('Order created successfully:', order._id);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Error creating order',
      error: error.message 
    });
  }
});

// Update order status (user can only update their own orders)
router.put('/:id/status', protect, async (req, res) => {
  try {
    console.log(`PUT /api/orders/${req.params.id}/status - Updating order status`);
    console.log('Request body:', req.body);

    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true }
    ).populate('items.product', 'name price images brand description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Order status updated successfully:', order._id);
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      message: 'Error updating order status',
      error: error.message 
    });
  }
});

// Create Razorpay order endpoint
router.post('/create-razorpay-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  try {
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: receipt || `order_rcptid_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 