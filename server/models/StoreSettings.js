const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
    default: 'JOOTA JUNCTION'
  },
  contactEmails: [{
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    label: {
      type: String,
      default: 'General'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  phoneNumbers: [{
    number: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      default: 'General'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  addresses: [{
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    },
    label: {
      type: String,
      default: 'Main Office'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  aboutStore: {
    type: String,
    default: 'Welcome to JOOTA JUNCTION - Your premier destination for stylish and comfortable footwear.'
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },
  businessHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: false } }
  },
  shippingSettings: {
    freeShippingThreshold: {
      type: Number,
      default: 1000
    },
    defaultShippingCost: {
      type: Number,
      default: 100
    }
  },
  taxSettings: {
    gstPercentage: {
      type: Number,
      default: 18
    },
    isTaxInclusive: {
      type: Boolean,
      default: false
    }
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
storeSettingsSchema.index({ isActive: 1 });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema); 