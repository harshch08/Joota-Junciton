require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

const products = [
  // RUNNING SHOES
  {
    name: 'Nike Air Zoom Pegasus 40',
    brand: 'Nike',
    category: 'Running',
    price: 12999,
    description: 'The Nike Air Zoom Pegasus 40 delivers more responsive cushioning and a breathable upper for your daily runs. Features Nike Air Zoom technology for lightweight, responsive cushioning.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 15 },
      { size: 8, stock: 20 },
      { size: 9, stock: 25 },
      { size: 10, stock: 30 },
      { size: 11, stock: 20 },
      { size: 12, stock: 15 }
    ],
    featured: true,
    rating: 4.5
  },
  {
    name: 'Adidas Ultraboost 22',
    brand: 'Adidas',
    category: 'Running',
    price: 15999,
    description: 'Experience ultimate energy return with the Adidas Ultraboost 22. Features Boost midsole technology and Primeknit upper for a sock-like fit.',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 12 },
      { size: 8, stock: 18 },
      { size: 9, stock: 22 },
      { size: 10, stock: 28 },
      { size: 11, stock: 18 },
      { size: 12, stock: 12 }
    ],
    featured: true,
    rating: 4.7
  },

  // CASUAL SHOES
  {
    name: 'Vans Old Skool Classic',
    brand: 'Vans',
    category: 'Casual',
    price: 5999,
    description: 'The iconic Vans Old Skool features the signature side stripe and durable canvas upper. Perfect for everyday casual wear.',
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 6, stock: 20 },
      { size: 7, stock: 25 },
      { size: 8, stock: 30 },
      { size: 9, stock: 35 },
      { size: 10, stock: 30 },
      { size: 11, stock: 25 },
      { size: 12, stock: 20 }
    ],
    featured: false,
    rating: 4.3
  },
  {
    name: 'Converse Chuck Taylor All Star',
    brand: 'Converse',
    category: 'Casual',
    price: 4999,
    description: 'The timeless Converse Chuck Taylor All Star in classic canvas. A must-have for any casual wardrobe.',
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 6, stock: 25 },
      { size: 7, stock: 30 },
      { size: 8, stock: 35 },
      { size: 9, stock: 40 },
      { size: 10, stock: 35 },
      { size: 11, stock: 30 },
      { size: 12, stock: 25 }
    ],
    featured: true,
    rating: 4.4
  },

  // HIKING SHOES
  {
    name: 'Merrell Moab 2 Mid Waterproof',
    brand: 'Merrell',
    category: 'Hiking',
    price: 8999,
    description: 'Waterproof hiking boots with Vibram outsole for superior traction. Perfect for trail hiking and outdoor adventures.',
    images: [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 10 },
      { size: 8, stock: 15 },
      { size: 9, stock: 20 },
      { size: 10, stock: 25 },
      { size: 11, stock: 15 },
      { size: 12, stock: 10 }
    ],
    featured: false,
    rating: 4.6
  },
  {
    name: 'Salomon X Ultra 3 Mid GTX',
    brand: 'Salomon',
    category: 'Hiking',
    price: 12999,
    description: 'Lightweight hiking boots with Gore-Tex waterproofing and advanced chassis for stability on challenging terrain.',
    images: [
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 8 },
      { size: 8, stock: 12 },
      { size: 9, stock: 18 },
      { size: 10, stock: 22 },
      { size: 11, stock: 12 },
      { size: 12, stock: 8 }
    ],
    featured: true,
    rating: 4.8
  },

  // LIFESTYLE SHOES
  {
    name: 'New Balance 574 Classic',
    brand: 'New Balance',
    category: 'Lifestyle',
    price: 7999,
    description: 'The iconic New Balance 574 combines retro style with modern comfort. Perfect for everyday lifestyle wear.',
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 18 },
      { size: 8, stock: 22 },
      { size: 9, stock: 28 },
      { size: 10, stock: 32 },
      { size: 11, stock: 22 },
      { size: 12, stock: 18 }
    ],
    featured: true,
    rating: 4.5
  },
  {
    name: 'Puma RS-X Reinvention',
    brand: 'Puma',
    category: 'Lifestyle',
    price: 8999,
    description: 'Bold retro-inspired design with chunky sole and vibrant colors. A statement piece for street style.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 15 },
      { size: 8, stock: 20 },
      { size: 9, stock: 25 },
      { size: 10, stock: 30 },
      { size: 11, stock: 20 },
      { size: 12, stock: 15 }
    ],
    featured: false,
    rating: 4.2
  },

  // FORMAL SHOES
  {
    name: 'Clarks Desert Boot',
    brand: 'Clarks',
    category: 'Formal',
    price: 9999,
    description: 'Classic suede desert boot with crepe sole. Perfect for smart casual and business casual occasions.',
    images: [
      'https://images.unsplash.com/photo-1614252361215-e8c8cde18d53?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 12 },
      { size: 8, stock: 18 },
      { size: 9, stock: 22 },
      { size: 10, stock: 25 },
      { size: 11, stock: 18 },
      { size: 12, stock: 12 }
    ],
    featured: false,
    rating: 4.4
  },
  {
    name: 'Allen Edmonds Park Avenue',
    brand: 'Allen Edmonds',
    category: 'Formal',
    price: 19999,
    description: 'Premium leather oxford shoes with Goodyear welt construction. The ultimate business formal shoe.',
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1614252361215-e8c8cde18d53?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 8, stock: 8 },
      { size: 9, stock: 12 },
      { size: 10, stock: 15 },
      { size: 11, stock: 12 },
      { size: 12, stock: 8 }
    ],
    featured: true,
    rating: 4.9
  },

  // BASKETBALL SHOES
  {
    name: 'Nike Air Jordan 1 Retro High',
    brand: 'Nike',
    category: 'Basketball',
    price: 14999,
    description: 'The iconic Air Jordan 1 in classic colorway. High-top design with Air-Sole unit for basketball performance.',
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 10 },
      { size: 8, stock: 15 },
      { size: 9, stock: 20 },
      { size: 10, stock: 25 },
      { size: 11, stock: 20 },
      { size: 12, stock: 15 }
    ],
    featured: true,
    rating: 4.7
  },
  {
    name: 'Adidas Harden Vol. 6',
    brand: 'Adidas',
    category: 'Basketball',
    price: 11999,
    description: 'James Harden signature basketball shoes with Lightstrike midsole and enhanced ankle support.',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 8 },
      { size: 8, stock: 12 },
      { size: 9, stock: 18 },
      { size: 10, stock: 22 },
      { size: 11, stock: 18 },
      { size: 12, stock: 12 }
    ],
    featured: false,
    rating: 4.3
  },

  // ATHLETIC SHOES
  {
    name: 'Under Armour HOVR Phantom 2',
    brand: 'Under Armour',
    category: 'Athletic',
    price: 10999,
    description: 'Versatile athletic shoes with HOVR cushioning technology. Perfect for gym workouts and cross-training.',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 15 },
      { size: 8, stock: 20 },
      { size: 9, stock: 25 },
      { size: 10, stock: 30 },
      { size: 11, stock: 20 },
      { size: 12, stock: 15 }
    ],
    featured: false,
    rating: 4.4
  },
  {
    name: 'Reebok Nano X1',
    brand: 'Reebok',
    category: 'Athletic',
    price: 9999,
    description: 'CrossFit training shoes with Floatride Energy Foam and flexible upper for dynamic movements.',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 7, stock: 12 },
      { size: 8, stock: 18 },
      { size: 9, stock: 22 },
      { size: 10, stock: 28 },
      { size: 11, stock: 18 },
      { size: 12, stock: 12 }
    ],
    featured: true,
    rating: 4.6
  },

  // SNEAKERS
  {
    name: 'Air Force 1 Low',
    brand: 'Nike',
    category: 'Sneakers',
    price: 8999,
    description: 'The classic Nike Air Force 1 in clean white leather. Timeless design that goes with everything.',
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 6, stock: 20 },
      { size: 7, stock: 25 },
      { size: 8, stock: 30 },
      { size: 9, stock: 35 },
      { size: 10, stock: 40 },
      { size: 11, stock: 30 },
      { size: 12, stock: 25 }
    ],
    featured: true,
    rating: 4.6
  },
  {
    name: 'Adidas Stan Smith',
    brand: 'Adidas',
    category: 'Sneakers',
    price: 6999,
    description: 'Iconic tennis-inspired sneakers with clean leather upper and signature green heel tab.',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=400&fit=crop'
    ],
    sizes: [
      { size: 6, stock: 18 },
      { size: 7, stock: 22 },
      { size: 8, stock: 28 },
      { size: 9, stock: 32 },
      { size: 10, stock: 35 },
      { size: 11, stock: 28 },
      { size: 12, stock: 22 }
    ],
    featured: false,
    rating: 4.5
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const insertedProducts = await Product.insertMany(products);
    console.log(`Successfully seeded ${insertedProducts.length} products:`);
    
    // Group products by category for better display
    const productsByCategory = {};
    insertedProducts.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });

    Object.keys(productsByCategory).forEach(category => {
      console.log(`\n${category} (${productsByCategory[category].length} products):`);
      productsByCategory[category].forEach(product => {
        console.log(`  - ${product.brand} ${product.name}: ₹${product.price.toLocaleString()}`);
      });
    });

    console.log('\nProduct seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts; 