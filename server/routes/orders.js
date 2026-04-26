const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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

    // Create the order without updating stock
    const order = await Order.create({
      user: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      totalPrice,
      shippingPrice: shippingPrice || 0,
      status: 'pending'
    });

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

    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order is being cancelled, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              [`sizes.$[elem].stock`]: item.quantity
            }
          },
          {
            arrayFilters: [{ 'elem.size': item.size }],
            new: true
          }
        );
      }
    }
    // If order is being delivered, reduce stock
    else if (status === 'delivered' && order.status !== 'delivered') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ 
            message: `Product not found: ${item.product}` 
          });
        }

        const sizeObj = product.sizes.find(s => s.size === item.size);
        if (!sizeObj) {
          return res.status(400).json({ 
            message: `Size ${item.size} not available for product: ${product.name}` 
          });
        }

        if (sizeObj.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name} (Size ${item.size})`
          });
        }

        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              [`sizes.$[elem].stock`]: -item.quantity
            }
          },
          {
            arrayFilters: [{ 'elem.size': item.size }],
            new: true
          }
        );
      }
    }

    // Update order status
    order.status = status;
    await order.save();

    // Populate product details for response
    await order.populate('items.product', 'name price images brand description');

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

  // Validate amount (minimum 100 paise = ₹1)
  const amountInPaise = Math.round(amount * 100);
  if (!amount || amountInPaise < 100) {
    return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise)' });
  }

  try {
    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verify Razorpay payment signature
router.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required payment fields' 
    });
  }

  try {
    // Generate expected signature using HMAC-SHA256
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    // Compare signatures
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment signature verification failed' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

module.exports = router; 