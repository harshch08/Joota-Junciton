/**
 * createAssistantIndex.js
 *
 * One-time migration script: creates a MongoDB text index on the products
 * collection to support the AI Shopping Assistant's full-text search.
 *
 * Usage:
 *   node server/scripts/createAssistantIndex.js
 *
 * The script connects using MONGODB_URI from server/.env, creates the index
 * if it does not already exist, and exits cleanly.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in server/.env');
  process.exit(1);
}

// The text index definition for the AI Shopping Assistant
const INDEX_SPEC = {
  name: 'text',
  description: 'text',
  brand: 'text',
  category: 'text',
};

const INDEX_OPTIONS = {
  background: true,
  name: 'assistant_text_search',
};

async function createAssistantIndex() {
  console.log('Connecting to MongoDB...');

  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const collection = db.collection('products');

  // Check whether a text index already exists on the products collection
  const existingIndexes = await collection.indexes();
  const hasTextIndex = existingIndexes.some(
    (idx) => idx.textIndexVersion !== undefined
  );

  if (hasTextIndex) {
    console.log(
      'Text index already exists on the products collection — no-op.'
    );
  } else {
    console.log('Creating text index on products collection...');
    await collection.createIndex(INDEX_SPEC, INDEX_OPTIONS);
    console.log(
      'Text index created successfully: { name, description, brand, category }'
    );
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB. Done.');
}

createAssistantIndex().catch((err) => {
  console.error('Failed to create index:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
