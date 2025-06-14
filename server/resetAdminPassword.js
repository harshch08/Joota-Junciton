require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

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

const resetAdminPassword = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Creating one...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await User.create({
        name: 'Admin',
        email: 'admin@jootajunction.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('Admin user created successfully!');
      console.log('Email: admin@jootajunction.com');
      console.log('Password: admin123');
      console.log('User ID:', newAdmin._id);
    } else {
      console.log('Admin user found. Resetting password...');
      
      // Reset password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.findByIdAndUpdate(adminUser._id, { password: hashedPassword });
      
      console.log('Admin password reset successfully!');
      console.log('Email:', adminUser.email);
      console.log('New Password: admin123');
      console.log('User ID:', adminUser._id);
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
};

// Run the script
resetAdminPassword(); 