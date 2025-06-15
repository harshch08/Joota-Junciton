const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dd6xzdhuk',
  api_key: process.env.CLOUDINARY_API_KEY || '788678742282591',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'HYRNiTdOQF1szroGCDkk5wmqYh0'
});

// Configure storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'joota-junction/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Configure storage for review images
const reviewStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'joota-junction/reviews',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }]
  }
});

// Create multer upload instances
const productUpload = multer({ storage: productStorage });
const reviewUpload = multer({ storage: reviewStorage });

module.exports = {
  cloudinary,
  productUpload,
  reviewUpload
}; 