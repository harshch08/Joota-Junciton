require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Try to find admin with new email
    let adminUser = await User.findOne({ email: 'admin@jootajunction.com' });

    if (adminUser) {
      console.log('Admin user with new email already exists');
      return;
    }

    // Try to find admin with old email
    const oldAdmin = await User.findOne({ email: 'admin@solestore.com' });

    if (oldAdmin) {
      // Update the old admin's email to the new one
      oldAdmin.email = 'admin@jootajunction.com';
      await oldAdmin.save();
      console.log('Updated admin email to admin@jootajunction.com');
      return;
    }

    // If no admin exists, create a new one
    const hashedPassword = await bcrypt.hash('admin123', 12);
    adminUser = new User({
      name: 'Admin User',
      email: 'admin@jootajunction.com',
      password: hashedPassword,
      role: 'admin',
      avatar: null,
      cart: []
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@jootajunction.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin; 