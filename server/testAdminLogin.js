require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Admin = require('./models/Admin');

const testAdminLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@jj.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('Available users:');
      const allUsers = await User.find({}, 'email role');
      allUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
    } else {
      console.log('✅ Admin user found!');
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      console.log('User ID:', adminUser._id);
      console.log('Password hash:', adminUser.password);
      
      // Test password
      const testPassword = 'admin@123';
      const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
      
      if (isPasswordValid) {
        console.log('✅ Password is correct!');
      } else {
        console.log('❌ Password is incorrect!');
        
        // Let's try to reset the password
        console.log('Resetting password...');
        const newHashedPassword = await bcrypt.hash(testPassword, 10);
        await User.findByIdAndUpdate(adminUser._id, { password: newHashedPassword });
        console.log('✅ Password reset successfully!');
      }
    }

    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');

  } catch (error) {
    console.error('Error testing admin login:', error);
    process.exit(1);
  }
};

// Run the test
testAdminLogin(); 