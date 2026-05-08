'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const assistantService = require('../services/assistantService');

const router = express.Router();

// Rate limiter: 30 requests per minute per IP
const assistantLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = new Date(req.rateLimit.resetTime).toISOString();
    res.status(429).json({
      error: `Too many requests. Try again after ${resetTime}.`,
    });
  },
});

// Input validation middleware
function validateQuery(req, res, next) {
  const { query } = req.body;

  if (query === undefined || query === null) {
    return res.status(400).json({
      error: 'query must be a non-empty string of at most 500 characters',
    });
  }

  if (typeof query !== 'string') {
    return res.status(400).json({
      error: 'query must be a non-empty string of at most 500 characters',
    });
  }

  if (query.trim().length === 0) {
    return res.status(400).json({
      error: 'query must be a non-empty string of at most 500 characters',
    });
  }

  if (query.length > 500) {
    return res.status(400).json({
      error: 'query must be a non-empty string of at most 500 characters',
    });
  }

  next();
}

// POST /api/assistant/query
router.post('/query', assistantLimiter, validateQuery, async (req, res) => {
  const { query } = req.body;

  try {
    const result = await assistantService.search(query.trim());
    return res.json(result);
  } catch (err) {
    console.error('[assistant route] Error:', err.status, err.message, err.stack);
    const statusMap = { 400: 400, 429: 429, 502: 502, 503: 503 };
    const status = statusMap[err.status] ?? 500;
    return res.status(status).json({ error: err.message });
  }
});

module.exports = router;
