'use strict';

const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const visualSearchService = require('../services/visualSearchService');

const router = express.Router();

// Multer: memory storage, 10 MB limit, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10_485_760 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported format. Upload a JPEG, PNG, or WebP image.'));
    }
  },
});

// Rate limiter: 20 requests per minute per IP
const visualSearchLimiter = rateLimit({
  windowMs: parseInt(process.env.VISUAL_SEARCH_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.VISUAL_SEARCH_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = new Date(Date.now() + req.rateLimit.resetTime).toISOString();
    res.status(429).json({
      error: `Too many requests. Try again after ${resetTime}.`,
    });
  },
});

// POST /api/visual-search
router.post(
  '/visual-search',
  visualSearchLimiter,
  (req, res, next) => {
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
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
      const { results, message } = await visualSearchService.search(
        req.file.buffer,
        req.file.mimetype
      );
      return res.json({ results, message });
    } catch (err) {
      if (err.status === 400) {
        return res.status(400).json({ error: err.error || err.message });
      }
      console.error('Visual search error:', err);
      return res.status(500).json({ error: 'Visual search temporarily unavailable. Please try again.' });
    }
  }
);

module.exports = router;
