const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true,
    minlength: [2, 'Brand name must be at least 2 characters long']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  logo: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
brandSchema.index({ name: 1 });

// Add method to check if brand exists
brandSchema.statics.findByName = async function(name) {
  return this.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
};

// Add method to get all active brands
brandSchema.statics.getActiveBrands = async function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Add pre-save middleware to ensure name is trimmed
brandSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.name = this.name.trim();
  }
  next();
});

const Brand = mongoose.model('Brand', brandSchema);

// Create default brands if none exist
Brand.createDefaultBrands = async function() {
  try {
    const count = await this.countDocuments();
    if (count === 0) {
      const defaultBrands = [
        { name: 'Nike', description: 'Just Do It', logo: 'https://via.placeholder.com/150' },
        { name: 'Adidas', description: 'Impossible Is Nothing', logo: 'https://via.placeholder.com/150' },
        { name: 'Puma', description: 'Forever Faster', logo: 'https://via.placeholder.com/150' },
        { name: 'Reebok', description: 'Be More Human', logo: 'https://via.placeholder.com/150' }
      ];
      await this.insertMany(defaultBrands);
      console.log('Default brands created successfully');
    }
  } catch (error) {
    console.error('Error creating default brands:', error);
  }
};

module.exports = Brand; 