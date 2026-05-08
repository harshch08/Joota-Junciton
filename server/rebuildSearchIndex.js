/**
 * One-time script to rebuild the visual search index for all existing products.
 * Run with: node rebuildSearchIndex.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected.\n');

  // Import service after DB connection (it requires Product model)
  const visualSearchService = require('./services/visualSearchService');

  console.log('Loading CLIP model (first run downloads ~170MB, please wait)...');
  await visualSearchService.loadModel();
  console.log('Model loaded.\n');

  console.log('Rebuilding index for all products...');
  const result = await visualSearchService.rebuildIndex();

  console.log('\n=== Rebuild Complete ===');
  console.log(`Indexed: ${result.indexed}`);
  console.log(`Failed:  ${result.failed}`);
  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach(e => console.log(`  - ${e.productId}: ${e.error}`));
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
