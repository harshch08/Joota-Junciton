// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'https://jjunction-backend.onrender.com';

// Cloudinary Configuration
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dd6xzdhuk';
export const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '788678742282591';
export const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'HYRNiTdOQF1szroGCDkk5wmqYh0';
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Joota-Junction';

// Image Configuration
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGES_PER_REVIEW = 5;
export const MAX_IMAGES_PER_PRODUCT = 10;

// API Endpoints
export const ENDPOINTS = {
  PRODUCTS: `${API_URL}/api/products`,
  REVIEWS: `${API_URL}/api/reviews`,
  AUTH: `${API_URL}/api/auth`,
  ORDERS: `${API_URL}/api/orders`,
  USERS: `${API_URL}/api/users`,
  CATEGORIES: `${API_URL}/api/categories`,
  BRANDS: `${API_URL}/api/brands`,
  ADMIN: `${API_URL}/api/admin`,
} as const; 