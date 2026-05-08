'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');

// ─── Cache ────────────────────────────────────────────────────────────────────

let brandsCache = [];
let categoriesCache = [];
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function refreshCache() {
  try {
    brandsCache = await Brand.distinct('name');
    categoriesCache = await Category.distinct('name');
  } catch (err) {
    console.error('[assistantService] Cache refresh failed:', err.message);
  }
}

refreshCache();
setInterval(refreshCache, CACHE_TTL_MS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(value, cache) {
  if (!value || !Array.isArray(cache)) return value;
  const lower = value.toLowerCase();
  const match = cache.find((item) => item.toLowerCase() === lower);
  return match !== undefined ? match : value;
}

function escapeRegex(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// ─── Intent Parsing via Gemini ────────────────────────────────────────────────

const INTENT_PROMPT = `You are a shopping assistant for a shoe e-commerce store called Joota Junction.
Extract the shopping intent from the user query and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

JSON fields:
- brand: string or null (e.g. "Nike", "Adidas")
- category: string or null (e.g. "Running", "Casual", "Formal")
- useCase: string or null (e.g. "running", "casual", "gym", "hiking")
- color: string or null (e.g. "white", "black", "red")
- minPrice: number or null (price in INR)
- maxPrice: number or null (price in INR)
- sortBy: "price_asc" | "price_desc" | "rating" | "newest" | null
- referenceProduct: string or null (product name mentioned as a reference, e.g. "Nike Air Max")

Rules:
- If the user says "cheaper than X" or "under X price", set maxPrice accordingly.
- If the user says "best rated" or "top rated", set sortBy to "rating".
- If the user says "newest" or "latest", set sortBy to "newest".
- If the user says "cheapest" or "lowest price", set sortBy to "price_asc".
- If the user says "most expensive" or "highest price", set sortBy to "price_desc".
- All prices are in INR (Indian Rupees). Convert if needed.
- Return null for any field you cannot confidently extract.`;

async function parseIntent(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('Assistant is not configured.');
    err.status = 503;
    console.error('[assistantService] GEMINI_API_KEY is not set.');
    throw err;
  }

  // Truncate to 500 chars
  const safeQuery = String(query).slice(0, 500);

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error('Intent parsing timed out. Please try again.');
      err.status = 502;
      reject(err);
    }, 10_000);
  });

  const callPromise = (async () => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

      const result = await model.generateContent(
        `${INTENT_PROMPT}\n\nUser query: ${safeQuery}`
      );

      let raw = result.response.text().trim();

      // Strip markdown code fences if Gemini wraps the JSON anyway
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      return JSON.parse(raw);
    } catch (err) {
      if (err.status) throw err;
      console.error('[assistantService] Gemini call error:', err);
      const apiErr = new Error('Intent parsing failed. Please try again.');
      apiErr.status = 502;
      throw apiErr;
    }
  })();

  return Promise.race([callPromise, timeoutPromise]);
}

// ─── Query Building ───────────────────────────────────────────────────────────

async function buildQuery(parsedIntent) {
  const filter = {};

  const brand = parsedIntent.brand
    ? normalize(parsedIntent.brand, brandsCache)
    : null;
  const category = parsedIntent.category
    ? normalize(parsedIntent.category, categoriesCache)
    : null;

  const textTerms = [];
  if (parsedIntent.useCase) textTerms.push(parsedIntent.useCase);
  if (parsedIntent.color) textTerms.push(parsedIntent.color);
  if (textTerms.length > 0) {
    filter.$text = { $search: textTerms.join(' ') };
  }

  if (brand) {
    filter.brand = new RegExp('^' + escapeRegex(brand) + '$', 'i');
  }

  if (category) {
    filter.category = new RegExp('^' + escapeRegex(category) + '$', 'i');
  }

  if (parsedIntent.referenceProduct) {
    try {
      const escapedRef = escapeRegex(parsedIntent.referenceProduct);
      const refProduct = await Product.findOne({
        name: new RegExp(escapedRef, 'i'),
      }).lean();

      if (refProduct) {
        filter._id = { $ne: refProduct._id };
        if (!category && refProduct.category) {
          filter.category = new RegExp('^' + escapeRegex(refProduct.category) + '$', 'i');
        }
      } else {
        console.info(
          `[assistantService] Reference product not found: "${parsedIntent.referenceProduct}". Falling back to category search.`
        );
      }
    } catch (err) {
      console.error('[assistantService] Reference product lookup error:', err.message);
    }
  }

  return filter;
}

// ─── Intent Summary ───────────────────────────────────────────────────────────

function buildIntentSummary(parsedIntent) {
  const parts = [];

  if (parsedIntent.referenceProduct) {
    parts.push('products similar to ' + parsedIntent.referenceProduct);
  } else {
    const descriptors = [];
    if (parsedIntent.color) descriptors.push(parsedIntent.color);
    if (parsedIntent.useCase) descriptors.push(parsedIntent.useCase);
    if (parsedIntent.category) {
      descriptors.push(parsedIntent.category.toLowerCase());
    } else {
      descriptors.push('shoes');
    }

    if (parsedIntent.brand) {
      parts.push(parsedIntent.brand + ' ' + descriptors.join(' '));
    } else {
      parts.push(descriptors.join(' '));
    }
  }

  if (parsedIntent.minPrice != null && parsedIntent.maxPrice != null) {
    parts.push(
      'between \u20b9' + parsedIntent.minPrice.toLocaleString('en-IN') +
      ' and \u20b9' + parsedIntent.maxPrice.toLocaleString('en-IN')
    );
  } else if (parsedIntent.maxPrice != null) {
    parts.push('under \u20b9' + parsedIntent.maxPrice.toLocaleString('en-IN'));
  } else if (parsedIntent.minPrice != null) {
    parts.push('above \u20b9' + parsedIntent.minPrice.toLocaleString('en-IN'));
  }

  if (parsedIntent.sortBy === 'rating') parts.push('(best rated)');
  else if (parsedIntent.sortBy === 'newest') parts.push('(newest first)');
  else if (parsedIntent.sortBy === 'price_asc') parts.push('(lowest price first)');
  else if (parsedIntent.sortBy === 'price_desc') parts.push('(highest price first)');

  return 'Showing ' + parts.join(' ');
}

// ─── In-memory Sort ───────────────────────────────────────────────────────────

function applySort(products, sortBy) {
  if (!sortBy) return products;
  const sorted = [...products];
  switch (sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price));
      break;
    case 'price_desc':
      sorted.sort((a, b) => (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }
  return sorted;
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

async function search(query) {
  const parsedIntent = await parseIntent(query);

  let filter;
  try {
    filter = await buildQuery(parsedIntent);
  } catch (err) {
    console.error('[assistantService] buildQuery error:', err);
    const dbErr = new Error('Product search failed. Please try again.');
    dbErr.status = 500;
    throw dbErr;
  }

  let candidates;
  try {
    candidates = await Product.find(filter).limit(50).lean();
  } catch (err) {
    console.error('[assistantService] Product.find error:', err);
    const dbErr = new Error('Product search failed. Please try again.');
    dbErr.status = 500;
    throw dbErr;
  }

  const { minPrice, maxPrice } = parsedIntent;
  let filtered = candidates;
  if (minPrice != null || maxPrice != null) {
    filtered = candidates.filter((doc) => {
      const effectivePrice = doc.discountedPrice ?? doc.price;
      if (minPrice != null && effectivePrice < minPrice) return false;
      if (maxPrice != null && effectivePrice > maxPrice) return false;
      return true;
    });
  }

  const sorted = applySort(filtered, parsedIntent.sortBy);
  const totalCount = sorted.length;
  const results = sorted.slice(0, 8);
  const intentSummary = buildIntentSummary(parsedIntent);

  return { results, parsedIntent, intentSummary, totalCount };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  search,
  normalize,
  escapeRegex,
  parseIntent,
  buildQuery,
  buildIntentSummary,
  applySort,
  getBrandsCache: () => brandsCache,
  getCategoriesCache: () => categoriesCache,
  _refreshCache: refreshCache,
};
