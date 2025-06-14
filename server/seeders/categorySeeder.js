const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const categories = [
  {
    name: 'Running',
    description: 'Performance running shoes designed for speed, comfort, and support during running activities.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop'
  },
  {
    name: 'Casual',
    description: 'Comfortable everyday shoes perfect for daily wear and casual outings.',
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=300&fit=crop'
  },
  {
    name: 'Hiking',
    description: 'Durable outdoor shoes with excellent traction and support for hiking and trail activities.',
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=300&fit=crop'
  },
  {
    name: 'Lifestyle',
    description: 'Fashion-forward shoes that combine style and comfort for modern urban living.',
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop'
  },
  {
    name: 'Formal',
    description: 'Elegant and sophisticated shoes suitable for business meetings and formal occasions.',
    image: 'https://images.unsplash.com/photo-1614252361215-e8c8cde18d53?w=400&h=300&fit=crop'
  },
  {
    name: 'Basketball',
    description: 'High-performance basketball shoes with ankle support and excellent court grip.',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
  },
  {
    name: 'Athletic',
    description: 'Versatile athletic shoes for various sports and fitness activities.',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=300&fit=crop'
  },
  {
    name: 'Sneakers',
    description: 'Classic sneaker designs that never go out of style.',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop'
  }
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`Successfully seeded ${insertedCategories.length} categories:`);
    
    insertedCategories.forEach(category => {
      console.log(`- ${category.name}: ${category.description}`);
    });

    console.log('\nCategory seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedCategories();
}

module.exports = seedCategories; 