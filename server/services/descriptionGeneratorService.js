'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const MAX_IMAGE_SIZE = 10_485_760; // 10 MB
const MIN_WORDS = 50;
const MAX_WORDS = 300;

const PROMPT = `You are a product copywriter for a shoe e-commerce store. 
Describe this shoe in ${MIN_WORDS}–${MAX_WORDS} words covering style, color, and apparent use case (e.g., running, casual, formal). 
Write in English. Do not include any headings or bullet points — write as a single flowing paragraph.`;

class DescriptionGeneratorService {
  /**
   * Generates a product description from a Cloudinary image URL using Gemini 1.5 Flash.
   * @param {string} imageUrl - Cloudinary URL of the product image
   * @returns {Promise<string>} - Generated description (50–300 words)
   */
  async generate(imageUrl) {
    if (!imageUrl) {
      const err = new Error('An image URL is required to generate a description.');
      err.status = 400;
      throw err;
    }

    // Fetch image bytes
    const fetch = (await import('node-fetch')).default;
    let imageBuffer;
    let mimeType;

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        const err = new Error('Could not retrieve the image. Ensure the product image is uploaded first.');
        err.status = 400;
        throw err;
      }

      // Check content-length header if available
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_SIZE) {
        const err = new Error('Image too large. Maximum size is 10 MB.');
        err.status = 400;
        throw err;
      }

      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

      // Check actual size after download
      if (imageBuffer.length > MAX_IMAGE_SIZE) {
        const err = new Error('Image too large. Maximum size is 10 MB.');
        err.status = 400;
        throw err;
      }

      // Determine MIME type from content-type header or URL extension
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        mimeType = 'image/jpeg';
      } else if (contentType.includes('png')) {
        mimeType = 'image/png';
      } else if (contentType.includes('webp')) {
        mimeType = 'image/webp';
      } else {
        // Fallback: infer from URL
        const url = imageUrl.toLowerCase();
        if (url.includes('.png')) mimeType = 'image/png';
        else if (url.includes('.webp')) mimeType = 'image/webp';
        else mimeType = 'image/jpeg'; // default for Cloudinary
      }
    } catch (err) {
      if (err.status) throw err;
      const fetchErr = new Error('Could not retrieve the image. Ensure the product image is uploaded first.');
      fetchErr.status = 400;
      throw fetchErr;
    }

    // Call Gemini 1.5 Flash
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const err = new Error('Description generation is not configured. GEMINI_API_KEY is missing.');
      err.status = 502;
      throw err;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

    let description;
    try {
      const result = await model.generateContent([
        PROMPT,
        {
          inlineData: {
            mimeType,
            data: imageBuffer.toString('base64'),
          },
        },
      ]);
      description = result.response.text().trim();
    } catch (err) {
      console.error('Gemini API error:', err);
      const apiErr = new Error('Description generation failed. Please try again or write a description manually.');
      apiErr.status = 502;
      throw apiErr;
    }

    // Validate word count
    const wordCount = description.split(/\s+/).filter(Boolean).length;
    if (wordCount < 30 || wordCount > 400) {
      const err = new Error('Generated description was outside acceptable length. Please try again.');
      err.status = 502;
      throw err;
    }

    return description;
  }
}

module.exports = new DescriptionGeneratorService();
