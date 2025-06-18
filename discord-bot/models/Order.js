// Order.js - MongoDB model for orders
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  region: { 
    type: String, 
    required: true,
    enum: ['us', 'uk', 'eu']
  },
  country: {
    type: String,
    // Only required for EU region (germany or france)
    required: function() {
      return this.region === 'eu';
    }
  },
  followers: { 
    type: String, 
    required: true,
    enum: ['5k-15k', '16k-30k', '31k-50k', '51k-100k', '100k+']
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
  additionalServices: [{
    type: String,
    enum: ['extended_support', 'custom_content']
  }],
  supportPackage: {
    type: String,
    enum: ['standard', 'silver', 'gold', 'diamond'],
    default: 'standard'
  },
  price: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'crypto'],
    required: function() {
      return this.status !== 'Pending';
    }
  },
  status: { 
    type: String, 
    required: true,
    enum: ['Pending', 'Paid', 'Processing', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;