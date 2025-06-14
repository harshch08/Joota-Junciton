const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const adminData = {
  name: 'Admin User',
  email: 'admin@jj.com',
  password: 'admin@123',
  role: 'admin',
  avatar: 'https://via.placeholder.com/150'
};

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/joota_junction', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      
      // Update password with proper hashing
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      await User.findByIdAndUpdate(existingAdmin._id, { 
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('Admin password updated successfully!');
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
      console.log('User ID:', existingAdmin._id);
    } else {
      console.log('Creating new admin user...');
      
      // Hash password before creating user
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      const admin = await User.create({
        ...adminData,
        password: hashedPassword
      });
      
      console.log('Admin user created successfully!');
      console.log('Email:', admin.email);
      console.log('Password:', adminData.password);
      console.log('User ID:', admin._id);
    }

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

// Run the seeder
seedAdmin(); 