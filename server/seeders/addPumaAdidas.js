const mongoose = require('mongoose');
const Brand = require('../models/Brand');
require('dotenv').config();

const newBrands = [
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

const addNewBrands = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if brands already exist
    for (const brand of newBrands) {
      const existingBrand = await Brand.findOne({ name: brand.name });
      if (!existingBrand) {
        await Brand.create(brand);
        console.log(`Added brand: ${brand.name}`);
      } else {
        console.log(`Brand already exists: ${brand.name}`);
      }
    }
    
    console.log('Brand addition completed');
    process.exit(0);
  } catch (error) {
    console.error('Error adding brands:', error);
    process.exit(1);
  }
};

addNewBrands(); 