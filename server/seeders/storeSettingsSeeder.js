require('dotenv').config();
const mongoose = require('mongoose');
const StoreSettings = require('../models/StoreSettings');

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

const storeSettingsData = {
  storeName: 'JOOTA JUNCTION',
  contactEmails: [
    {
      email: 'admin@jootajunction.com',
      label: 'General',
      isActive: true
    },
    {
      email: 'support@jootajunction.com',
      label: 'Customer Support',
      isActive: true
    }
  ],
  phoneNumbers: [
    {
      number: '+91 98765 43210',
      label: 'General',
      isActive: true
    },
    {
      number: '+91 98765 43211',
      label: 'Customer Support',
      isActive: true
    }
  ],
  addresses: [
    {
      street: '123 Fashion Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
      label: 'Main Office',
      isActive: true
    },
    {
      street: '456 Shopping Mall',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India',
      label: 'Branch Office',
      isActive: true
    }
  ],
  aboutStore: 'Welcome to JOOTA JUNCTION - Your premier destination for stylish and comfortable footwear. We offer a wide range of shoes for every occasion, from casual sneakers to formal dress shoes. Our commitment to quality, style, and customer satisfaction makes us the go-to choice for footwear in India.',
  socialMedia: {
    facebook: 'https://facebook.com/jootajunction',
    instagram: 'https://instagram.com/jootajunction',
    twitter: 'https://twitter.com/jootajunction',
    linkedin: 'https://linkedin.com/company/jootajunction'
  },
  businessHours: {
    monday: { open: '09:00', close: '21:00', isOpen: true },
    tuesday: { open: '09:00', close: '21:00', isOpen: true },
    wednesday: { open: '09:00', close: '21:00', isOpen: true },
    thursday: { open: '09:00', close: '21:00', isOpen: true },
    friday: { open: '09:00', close: '21:00', isOpen: true },
    saturday: { open: '10:00', close: '22:00', isOpen: true },
    sunday: { open: '11:00', close: '20:00', isOpen: false }
  },
  shippingSettings: {
    freeShippingThreshold: 1000,
    defaultShippingCost: 100
  },
  taxSettings: {
    gstPercentage: 18,
    isTaxInclusive: false
  },
  currency: 'INR',
  isActive: true
};

const seedStoreSettings = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Check if settings already exist
    const existingSettings = await StoreSettings.findOne({ isActive: true });
    
    if (existingSettings) {
      console.log('Store settings already exist. Skipping seeding.');
      return;
    }

    // Create new store settings
    const storeSettings = await StoreSettings.create(storeSettingsData);
    console.log('Store settings seeded successfully:', storeSettings.storeName);
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error seeding store settings:', error);
    process.exit(1);
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedStoreSettings();
}

module.exports = seedStoreSettings; 