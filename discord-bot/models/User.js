// User.js - MongoDB model for user data
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  email: {
    type: String
  },
  preferences: {
    region: {
      type: String,
      enum: ['us', 'uk', 'eu', null],
      default: null
    },
    contactMethod: {
      type: String,
      enum: ['discord', 'email', 'telegram', null],
      default: 'discord'
    },
    notifications: {
      specialOffers: {
        type: Boolean,
        default: false
      },
      tiktokTips: {
        type: Boolean,
        default: false
      },
      productUpdates: {
        type: Boolean,
        default: false
      }
    }
  },
  statistics: {
    ordersPlaced: {
      type: Number,
      default: 0
    },
    ticketsCreated: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  discordRoles: [{
    type: String
  }],
  notes: {
    type: String
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the lastActive field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.statistics.lastActive = Date.now();
  next();
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports