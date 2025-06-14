const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the Brand model
const Brand = require('../models/Brand');

// Brand data to seed
const brands = [
  {
    name: 'Jordan',
    description: 'Iconic basketball and lifestyle brand by Nike.',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/3e/Air_Jordan_logo.svg',
    bgColor: '#F7C948'
  },
  {
    name: 'Nike',
    description: 'Just Do It. Leading athletic footwear and apparel brand.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
    bgColor: '#F2994A'
  },
  {
    name: 'Yeezy',
    description: "Kanye West's iconic sneaker line.",
    logo: 'https://seeklogo.com/images/Y/yeezy-logo-6B2B6B6B2B-seeklogo.com.png',
    bgColor: '#4F8DFD'
  },
  {
    name: 'New Balance',
    description: 'Fearlessly Independent Since 1906. American multinational corporation that designs and manufactures athletic shoes and apparel.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/New_Balance_logo.svg',
    bgColor: '#2D6A6C'
  },
  {
    name: 'Skechers',
    description: 'Comfortable, stylish footwear for everyone.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Skechers_logo.svg',
    bgColor: '#B2B2B2'
  },
  {
    name: 'Louis Vuitton',
    description: 'Luxury fashion house specializing in leather goods, ready-to-wear, shoes, watches, jewelry, accessories, sunglasses, and books.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Louis_Vuitton_logo_and_wordmark.svg',
    bgColor: '#4E342E'
  },
  {
    name: 'Reebok',
    description: 'Be More Human. British-American multinational corporation that designs and manufactures athletic shoes and clothing.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Reebok_2019_logo.svg',
    bgColor: '#E53935'
  },
  {
    name: 'Asics',
    description: 'Anima Sana In Corpore Sano (A Sound Mind in a Sound Body).',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Asics_Logo.svg',
    bgColor: '#283593'
  },
  {
    name: 'Crocs',
    description: 'Comfortable, colorful, and lightweight footwear for everyone.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Crocs_logo.svg',
    bgColor: '#43A047'
  },
  {
    name: "Puma",
    description: "Puma is a German multinational corporation that designs and manufactures athletic and casual footwear, apparel and accessories.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Puma_logo.svg/1200px-Puma_logo.svg.png",
    bgColor: "#000000",
    isActive: true
  },
  {
    name: "Adidas",
    description: "Adidas is a German athletic apparel and footwear corporation headquartered in Herzogenaurach, Bavaria, Germany.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/1200px-Adidas_Logo.svg.png",
    bgColor: "#000000",
    isActive: true
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed brands function
const seedBrands = async () => {
  try {
    console.log('Starting brand seeding...');
    
    // Check if brands already exist
    const existingBrands = await Brand.find();
    if (existingBrands.length > 0) {
      console.log(`${existingBrands.length} brands already exist. Skipping seeding.`);
      return;
    }

    // Insert brands
    const insertedBrands = await Brand.insertMany(brands);
    console.log(`Successfully seeded ${insertedBrands.length} brands:`);
    
    insertedBrands.forEach(brand => {
      console.log(`- ${brand.name} (slug: ${brand.slug})`);
    });

    console.log('Brand seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding brands:', error);
  }
};

// Main execution function
const main = async () => {
  try {
    await connectDB();
    await seedBrands();
    console.log('All seeding operations completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeder
if (require.main === module) {
  main();
}

module.exports = { seedBrands }; 