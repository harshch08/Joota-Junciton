'use strict';

const Product = require('../models/Product');

class VisualSearchService {
  constructor() {
    this.pipeline = null;
  }

  /**
   * Lazy-loads the CLIP image-feature-extraction pipeline from @xenova/transformers.
   * Caches the pipeline instance on this.pipeline after the first call.
   */
  async loadModel() {
    if (this.pipeline) return;
    // @xenova/transformers is ESM — must use dynamic import
    const { pipeline } = await import('@xenova/transformers');
    this.pipeline = await pipeline(
      'image-feature-extraction',
      'Xenova/clip-vit-base-patch32'
    );
  }

  /**
   * Generates a 512-dimensional Float32Array embedding from an image buffer.
   * @param {Buffer} imageBuffer
   * @returns {Promise<Float32Array>}
   */
  async generateEmbedding(imageBuffer) {
    await this.loadModel();
    // Use RawImage to load from buffer — avoids data URL fetch issues
    const { RawImage } = await import('@xenova/transformers');
    // Blob is available globally in Node 18+; fall back to buffer.buffer for older versions
    const blob = typeof Blob !== 'undefined'
      ? new Blob([imageBuffer])
      : new (require('buffer').Blob)([imageBuffer]);
    const image = await RawImage.fromBlob(blob);
    const output = await this.pipeline(image, { pooling: 'mean', normalize: true });
    // output.data is a Float32Array of 512 dimensions
    return output.data;
  }

  /**
   * Validates the input image buffer and MIME type.
   * Throws an object with { status, error } on failure.
   * @param {Buffer} fileBuffer
   * @param {string} mimeType
   */
  validateInput(fileBuffer, mimeType) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw { status: 400, error: 'Unsupported format. Upload a JPEG, PNG, or WebP image.' };
    }
    if (fileBuffer.length > 10_485_760) {
      throw { status: 400, error: 'File too large. Maximum size is 10 MB.' };
    }
  }

  /**
   * Computes cosine similarity between two numeric arrays.
   * @param {ArrayLike<number>} a
   * @param {ArrayLike<number>} b
   * @returns {number}
   */
  _cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Searches for visually similar products given an image buffer.
   * @param {Buffer} imageBuffer
   * @param {string} mimeType
   * @param {number} [topK=12]
   * @returns {Promise<{ results: Array<{ product: object, similarityScore: number }>, message?: string }>}
   */
  async search(imageBuffer, mimeType, topK = 12) {
    // 1. Validate input
    this.validateInput(imageBuffer, mimeType);

    // 2. Generate query embedding
    const queryEmbedding = await this.generateEmbedding(imageBuffer);

    // 3. Fetch all products with their embeddings (combine selects into one call)
    const products = await Product.find({})
      .select('+embedding name brand category price discountedPrice images sizes');

    // 4. Filter to products that have an embedding array
    const indexedProducts = products.filter(
      (p) => Array.isArray(p.embedding) && p.embedding.length > 0
    );

    // 5. Compute cosine similarity for each product
    const scored = indexedProducts.map((product) => ({
      product,
      similarityScore: this._cosineSimilarity(queryEmbedding, product.embedding),
    }));

    // 6. Filter out products where ALL sizes have stock === 0
    const inStock = scored.filter((item) => {
      const sizes = item.product.sizes;
      if (!sizes || sizes.length === 0) return false;
      return sizes.some((s) => s.stock > 0);
    });

    // 7. Filter out products with similarity score < 0.3
    const aboveThreshold = inStock.filter((item) => item.similarityScore >= 0.3);

    // 8. Sort descending by score, take top topK (max 12)
    const limit = Math.min(topK, 12);
    const results = aboveThreshold
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    // 9. Return results or empty message
    if (results.length === 0) {
      return {
        results: [],
        message: 'No similar products found. Try browsing by category.',
      };
    }

    return { results, message: undefined };
  }

  /**
   * Indexes a product by fetching its primary image and generating an embedding.
   * Errors are logged and swallowed — product CRUD must never fail due to indexing.
   * @param {string|object} productId
   * @param {string[]} imageUrls
   */
  async indexProduct(productId, imageUrls) {
    if (!imageUrls || imageUrls.length === 0) return;

    try {
      // node-fetch v3 is ESM — use dynamic import
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(imageUrls[0]);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const embedding = await this.generateEmbedding(buffer);

      await Product.findByIdAndUpdate(productId, {
        embedding: Array.from(embedding),
      });
    } catch (err) {
      console.error('VisualSearch indexProduct error:', err);
    }
  }

  /**
   * Removes the embedding field from a product document.
   * Errors are logged and swallowed.
   * @param {string|object} productId
   */
  async removeProduct(productId) {
    try {
      await Product.findByIdAndUpdate(productId, { $unset: { embedding: '' } });
    } catch (err) {
      console.error('VisualSearch removeProduct error:', err);
    }
  }

  /**
   * Rebuilds the embedding index for all products in batches of 50.
   * Returns a summary of indexed, failed, and error details.
   * @returns {Promise<{ indexed: number, failed: number, errors: Array<{ productId: string, error: string }> }>}
   */
  async rebuildIndex() {
    let indexed = 0;
    let failed = 0;
    const errors = [];

    const batchSize = 50;
    let skip = 0;
    let batch;

    do {
      batch = await Product.find({}).select('_id images').skip(skip).limit(batchSize);

      for (const product of batch) {
        try {
          await this.indexProduct(product._id, product.images);
          indexed++;
        } catch (err) {
          failed++;
          errors.push({ productId: String(product._id), error: err.message });
        }
      }

      skip += batchSize;
    } while (batch.length === batchSize);

    return { indexed, failed, errors };
  }
}

module.exports = new VisualSearchService();
