// Ticket.js - MongoDB model for support tickets
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { 
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
  issue: { 
    type: String, 
    required: true 
  },
  urgency: { 
    type: String, 
    required: true,
    enum: ['Normal', 'High', 'Critical']
  },
  status: { 
    type: String, 
    required: true,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  channelId: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    default: null
  },
  responses: [{
    userId: String,
    username: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  orderId: {
    type: String,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  closedAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
ticketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create the Ticket model
const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;