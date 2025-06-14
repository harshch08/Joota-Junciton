const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Create upload directories if they don't exist
const uploadDirs = ['uploads/products', 'uploads/reviews'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Create Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    host: req.headers.host,
    headers: req.headers,
    url: req.url
  });
  next();
});

// Middleware
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request Headers:', req.headers);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  console.log('Connection state:', mongoose.connection.readyState);
  
  // Seed store settings if they don't exist
  try {
    const StoreSettings = require('./models/StoreSettings');
    const existingSettings = await StoreSettings.findOne({ isActive: true });
    
    if (!existingSettings) {
      console.log('No store settings found. Creating default settings...');
      const defaultSettings = {
        storeName: 'JOOTA JUNCTION',
        contactEmails: [
          { email: 'admin@jootajunction.com', label: 'General', isActive: true },
          { email: 'support@jootajunction.com', label: 'Customer Support', isActive: true }
        ],
        phoneNumbers: [
          { number: '+91 98765 43210', label: 'General', isActive: true },
          { number: '+91 98765 43211', label: 'Customer Support', isActive: true }
        ],
        addresses: [
          {
            street: '123 Fashion Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            zipCode: '400001',
            country: 'India',
            label: 'Main Office',
            isActive: true
          }
        ],
        aboutStore: 'Welcome to JOOTA JUNCTION - Your premier destination for stylish and comfortable footwear.',
        currency: 'INR',
        isActive: true
      };
      
      await StoreSettings.create(defaultSettings);
      console.log('Default store settings created successfully.');
    } else {
      console.log('Store settings already exist.');
    }
  } catch (error) {
    console.error('Error seeding store settings:', error);
  }
})
.catch((error) => {
  console.error('MongoDB connection error:', {
    message: error.message,
    name: error.name,
    code: error.code,
    stack: error.stack
  });
  process.exit(1);
});

// Monitor MongoDB connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const reviewsRouter = require('./routes/reviews');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/reviews', reviewsRouter);
app.use('/uploads/reviews', express.static('uploads/reviews'));
app.use('/uploads/products', express.static('uploads/products'));

// Basic route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code
  });
  
  // Check if it's a MongoDB error
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      message: 'Database error',
      error: err.message,
      code: err.code
    });
  }

  // Check if it's a Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      error: err.message
    });
  }

  // Default error
  res.status(500).json({
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
}); 