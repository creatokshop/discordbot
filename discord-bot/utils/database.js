const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB connection string from environment variables or config
const connectionString = process.env.MONGODB_URI;
let isDbConnected = false;

// User Schema - Comprehensive version with all original fields
const userSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true 
  },
  tag: { 
    type: String, 
    required: true 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  region: { 
    type: String, 
    enum: ['us', 'uk', 'eu', 'none'], 
    default: 'none' 
  },
  purchases: { 
    type: Number, 
    default: 0 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  interactions: { 
    type: Number, 
    default: 0 
  },
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'verified'],
    default: 'none'
  },
  balance: {
    type: Number,
    default: 0
  },
  preferredChannel: {
    type: String,
    enum: ['general', 'region'],
    default: 'general'
  },
  firstRegionSelection: {
    type: Date
  },
  regionChanges: {
    type: Number,
    default: 0
  },
  // Additional tracking fields from original
  totalSpent: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String
  },
  referralCount: {
    type: Number,
    default: 0
  },
  // Discount-related fields
  usedDiscountCodes: [{
    code: String,
    usedAt: { type: Date, default: Date.now },
    orderId: String,
    discountAmount: Number
  }]
});

// NEW: Discount Schema
const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount']
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  userLimit: {
    type: Number,
    default: 1 // How many times one user can use this code
  },
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  maximumDiscount: {
    type: Number,
    default: null // For percentage discounts, cap the max discount amount
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    default: null // null means no expiration
  },
  allowedRegions: [{
    type: String,
    enum: ['US', 'UK', 'EU', 'Non-TTS']
  }],
  allowedAccountTypes: [String], // e.g., ['Aged Account', 'Fresh Account']
  createdBy: {
    type: String, // Staff member who created it
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Track which users have used this code
  usedBy: [{
    userId: String,
    userTag: String,
    usedAt: { type: Date, default: Date.now },
    orderId: String,
    discountAmount: Number
  }]
});

// Order Schema - Enhanced with discount tracking
const orderSchema = new mongoose.Schema({
  orderID: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userTag: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true,
    enum: ['US', 'UK', 'EU', 'Non-TTS']
  },
  accountType: {
    type: String,
    required: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  // Discount information
  discountApplied: {
    type: Boolean,
    default: false
  },
  discountCode: {
    type: String,
    default: 'None'
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'none'],
    default: 'none'
  },
  discountValue: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true
  },
  additionalNotes: {
    type: String,
    default: 'None'
  },
  status: {
    type: String,
    enum: ['pending', 'payment_sent', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  channelId: {
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
  },
  paymentReceived: {
    type: Boolean,
    default: false
  },
  paymentDate: {
    type: Date
  },
  accountDelivered: {
    type: Boolean,
    default: false
  },
  deliveryDate: {
    type: Date
  },
  handledBy: {
    type: String
  },
  staffNotes: {
    type: String
  },
  paymentProof: {
    type: String
  },
  accountDetails: {
    type: String
  },
  trackingNumber: {
    type: String
  }
});

// Create the models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Discount = mongoose.models.Discount || mongoose.model('Discount', discountSchema);

// Connection management with all original logging and handling
const connectToDatabase = async () => {
  try {
    if (!connectionString) {
      console.error('❌ MongoDB URI is not defined in environment variables');
      console.error('Please set MONGODB_URI in your .env file');
      return false;
    }
    
    const maskedURI = connectionString.includes('@') 
      ? connectionString.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://**:**@')
      : 'mongodb://<masked>';
    console.log(`Attempting to connect to MongoDB...`);
    console.log(`Using connection string: ${maskedURI}`);
    
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 30000
    });
    
    console.log('✅ Successfully connected to MongoDB');
    isDbConnected = true;
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected! Attempting to reconnect...');
      isDbConnected = false;
      setTimeout(connectToDatabase, 5000);
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isDbConnected = false;
      setTimeout(connectToDatabase, 5000);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    isDbConnected = false;
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server - check the following:');
      console.error('1. Is your MongoDB server running?');
      console.error('2. Is your connection string correct?');
      console.error('3. If using MongoDB Atlas, is your IP whitelisted?');
      console.error('4. Are there any network issues or firewalls blocking the connection?');
    }
    
    setTimeout(connectToDatabase, 5000);
    return false;
  }
};

// Check connection status
const isConnected = () => {
  return isDbConnected && mongoose.connection.readyState === 1;
};

// User Functions - Complete implementations (unchanged)
const getOrCreateUser = async (userData) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    let user = await User.findOne({ id: userData.id });
    
    if (!user) {
      user = new User({
        id: userData.id,
        tag: userData.tag,
        joinedAt: userData.joinedAt || new Date(),
        region: userData.region || 'none',
        purchases: 0,
        interactions: 0,
        balance: 0,
        verificationStatus: 'none',
        preferredChannel: 'general',
        regionChanges: 0,
        usedDiscountCodes: []
      });
      await user.save();
      console.log(`Created new user in database: ${userData.tag}`);
    } else {
      user.lastActive = new Date();
      if (user.tag !== userData.tag) {
        user.tag = userData.tag;
      }
      await user.save();
    }
    
    return user;
  } catch (error) {
    console.error(`Error in getOrCreateUser for ${userData.tag}:`, error.message);
    throw error;
  }
};

const updateUserRegion = async (userId, region, channelType = 'general') => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const validRegions = ['us', 'uk', 'eu', 'none'];
    if (!validRegions.includes(region.toLowerCase())) {
      throw new Error(`Invalid region: ${region}`);
    }

    const currentUser = await User.findOne({ id: userId });
    const isFirstSelection = !currentUser || currentUser.region === 'none';
    const isRegionChange = currentUser && currentUser.region !== 'none' && currentUser.region !== region.toLowerCase();

    const updateData = {
      region: region.toLowerCase(),
      preferredChannel: channelType,
      lastActive: new Date()
    };

    if (isFirstSelection) {
      updateData.firstRegionSelection = new Date();
    }

    if (isRegionChange) {
      updateData.$inc = { regionChanges: 1 };
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      updateData,
      { new: true, upsert: false }
    );
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  } catch (error) {
    console.error(`Error updating user region for ${userId}:`, error.message);
    throw error;
  }
};

const trackInteraction = async (userId, interactionType = 'general') => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      { 
        $inc: { interactions: 1 },
        lastActive: new Date()
      },
      { new: true, upsert: false }
    );
    
    if (user) {
      console.log(`Tracked ${interactionType} interaction for user ${userId} (total: ${user.interactions})`);
    }
    
    return user;
  } catch (error) {
    console.error(`Error tracking interaction for ${userId}:`, error.message);
    throw error;
  }
};

// NEW: Discount Functions
const createDiscountCode = async (discountData, createdBy) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const discount = new Discount({
      ...discountData,
      code: discountData.code.toUpperCase(),
      createdBy: createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await discount.save();
    console.log(`✅ Created discount code: ${discount.code}`);
    return discount;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Discount code already exists');
    }
    console.error('Error creating discount code:', error.message);
    throw error;
  }
};

const validateDiscountCode = async (code, userId, orderData) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    // Find the discount code
    const discount = await Discount.findOne({ 
      code: code.toUpperCase(),
      isActive: true 
    });

    if (!discount) {
      return { 
        valid: false, 
        error: 'Invalid or inactive discount code',
        discount: null,
        discountAmount: 0
      };
    }

    // Check if code has expired
    if (discount.validUntil && new Date() > discount.validUntil) {
      return { 
        valid: false, 
        error: 'Discount code has expired',
        discount: null,
        discountAmount: 0
      };
    }

    // Check if code is not yet valid
    if (discount.validFrom && new Date() < discount.validFrom) {
      return { 
        valid: false, 
        error: 'Discount code is not yet valid',
        discount: null,
        discountAmount: 0
      };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return { 
        valid: false, 
        error: 'Discount code usage limit reached',
        discount: null,
        discountAmount: 0
      };
    }

    // Check minimum order amount
    if (orderData.price < discount.minimumOrderAmount) {
      return { 
        valid: false, 
        error: `Minimum order amount of $${discount.minimumOrderAmount} required`,
        discount: null,
        discountAmount: 0
      };
    }

    // Check region restrictions
    if (discount.allowedRegions.length > 0 && !discount.allowedRegions.includes(orderData.region)) {
      return { 
        valid: false, 
        error: 'Discount code not valid for your region',
        discount: null,
        discountAmount: 0
      };
    }

    // Check account type restrictions
    if (discount.allowedAccountTypes.length > 0 && !discount.allowedAccountTypes.includes(orderData.accountType)) {
      return { 
        valid: false, 
        error: 'Discount code not valid for this account type',
        discount: null,
        discountAmount: 0
      };
    }

    // Check user usage limit
    const userUsage = discount.usedBy.filter(usage => usage.userId === userId).length;
    if (userUsage >= discount.userLimit) {
      return { 
        valid: false, 
        error: 'You have already used this discount code',
        discount: null,
        discountAmount: 0
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (orderData.price * discount.value) / 100;
      if (discount.maximumDiscount && discountAmount > discount.maximumDiscount) {
        discountAmount = discount.maximumDiscount;
      }
    } else if (discount.type === 'fixed_amount') {
      discountAmount = Math.min(discount.value, orderData.price);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    return {
      valid: true,
      error: null,
      discount: discount,
      discountAmount: discountAmount,
      finalPrice: orderData.price - discountAmount
    };
  } catch (error) {
    console.error('Error validating discount code:', error.message);
    throw error;
  }
};

const applyDiscountCode = async (code, userId, userTag, orderId, discountAmount) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    // Update discount usage
    const discount = await Discount.findOneAndUpdate(
      { code: code.toUpperCase() },
      {
        $inc: { usageCount: 1 },
        $push: {
          usedBy: {
            userId: userId,
            userTag: userTag,
            usedAt: new Date(),
            orderId: orderId,
            discountAmount: discountAmount
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    // Update user's discount history
    await User.findOneAndUpdate(
      { id: userId },
      {
        $push: {
          usedDiscountCodes: {
            code: code.toUpperCase(),
            usedAt: new Date(),
            orderId: orderId,
            discountAmount: discountAmount
          }
        }
      }
    );

    console.log(`✅ Applied discount code ${code} for user ${userTag} (Order: ${orderId})`);
    return discount;
  } catch (error) {
    console.error('Error applying discount code:', error.message);
    throw error;
  }
};

const getDiscountCodes = async (activeOnly = false) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const filter = activeOnly ? { isActive: true } : {};
    return await Discount.find(filter).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting discount codes:', error.message);
    throw error;
  }
};

const updateDiscountCode = async (code, updateData) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const discount = await Discount.findOneAndUpdate(
      { code: code.toUpperCase() },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!discount) {
      throw new Error('Discount code not found');
    }

    return discount;
  } catch (error) {
    console.error('Error updating discount code:', error.message);
    throw error;
  }
};

const deleteDiscountCode = async (code) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const discount = await Discount.findOneAndDelete({ code: code.toUpperCase() });
    
    if (!discount) {
      throw new Error('Discount code not found');
    }

    console.log(`✅ Deleted discount code: ${code}`);
    return discount;
  } catch (error) {
    console.error('Error deleting discount code:', error.message);
    throw error;
  }
};

// Enhanced Order Functions with Discount Support
const recordPurchase = async (userId, orderData) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    // Update the user's purchase count and total spent (use final price after discount)
    const user = await User.findOneAndUpdate(
      { id: userId },
      { 
        $inc: { 
          purchases: 1,
          totalSpent: orderData.price // This should be the final price after discount
        },
        lastActive: new Date(),
        lastPurchaseDate: new Date()
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Create the order record with discount information
    const order = new Order({
      orderID: orderData.orderID,
      userId: userId,
      userTag: orderData.userTag || user.tag,
      region: orderData.region,
      accountType: orderData.accountType,
      originalPrice: orderData.originalPrice || orderData.price,
      price: orderData.price, // Final price after discount
      discountApplied: orderData.discountApplied || false,
      discountCode: orderData.discountCode || 'None',
      discountType: orderData.discountType || 'none',
      discountValue: orderData.discountValue || 0,
      discountAmount: orderData.discountAmount || 0,
      paymentMethod: orderData.paymentMethod,
      additionalNotes: orderData.additionalNotes || 'None',
      status: 'pending',
      channelId: orderData.channelId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await order.save();
    return order;
  } catch (error) {
    console.error('Error recording purchase:', error.message);
    throw error;
  }
};

// All other existing functions remain unchanged...
const getOrderById = async (orderId) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    return await Order.findOne({ orderID: orderId });
  } catch (error) {
    console.error('Error getting order:', error.message);
    throw error;
  }
};

const updateOrderStatus = async (orderId, status, options = {}) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const updateData = { 
      status,
      updatedAt: new Date(),
      ...(status === 'completed' && { 
        completedAt: new Date(),
        accountDelivered: true,
        deliveryDate: new Date()
      }),
      ...(options.channelId && { channelId: options.channelId }),
      ...(options.staffId && { handledBy: options.staffId }),
      ...(options.staffNotes && { staffNotes: options.staffNotes }),
      ...(options.paymentProof && { paymentProof: options.paymentProof }),
      ...(options.accountDetails && { accountDetails: options.accountDetails })
    };

    const order = await Order.findOneAndUpdate(
      { orderID: orderId },
      updateData,
      { new: true }
    );

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  } catch (error) {
    console.error('Error updating order status:', error.message);
    throw error;
  }
};

const getPendingOrders = async () => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    return await Order.find({ 
      status: { $in: ['pending', 'payment_sent', 'processing'] }
    }).sort({ createdAt: 1 });
  } catch (error) {
    console.error('Error getting pending orders:', error.message);
    throw error;
  }
};

const getUserOrders = async (userId) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    return await Order.find({ userId: userId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting user orders:', error.message);
    throw error;
  }
};

// Analytics Functions
const getUserStats = async (userId) => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const user = await User.findOne({ id: userId });
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      tag: user.tag,
      joinedAt: user.joinedAt,
      region: user.region,
      preferredChannel: user.preferredChannel,
      interactions: user.interactions,
      purchases: user.purchases,
      totalSpent: user.totalSpent,
      regionChanges: user.regionChanges,
      firstRegionSelection: user.firstRegionSelection,
      lastActive: user.lastActive,
      lastPurchaseDate: user.lastPurchaseDate,
      verificationStatus: user.verificationStatus,
      balance: user.balance,
      usedDiscountCodes: user.usedDiscountCodes
    };
  } catch (error) {
    console.error('Error getting user stats:', error.message);
    throw error;
  }
};

const getRegionStats = async () => {
  try {
    if (!isConnected()) {
      console.warn('Attempted to access database while disconnected');
      await connectToDatabase();
      if (!isConnected()) {
        throw new Error('Database connection not available');
      }
    }

    const stats = await User.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
          totalInteractions: { $sum: '$interactions' },
          totalPurchases: { $sum: '$purchases' },
          totalSpent: { $sum: '$totalSpent' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const formattedStats = {
      total: 0,
      regions: {}
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      formattedStats.regions[stat._id] = {
        users: stat.count,
        interactions: stat.totalInteractions,
        purchases: stat.totalPurchases,
        totalSpent: stat.totalSpent || 0
      };
    });

    return formattedStats;
  } catch (error) {
    console.error('Error getting region stats:', error.message);
    throw error;
  }
};

// Export all functions and models
module.exports = {
  connectToDatabase,
  isConnected,
  User,
  Order,
  Discount,
  getOrCreateUser,
  updateUserRegion,
  trackInteraction,
  recordPurchase,
  getOrderById,
  updateOrderStatus,
  getPendingOrders,
  getUserOrders,
  getUserStats,
  getRegionStats,
  // New discount functions
  createDiscountCode,
  validateDiscountCode,
  applyDiscountCode,
  getDiscountCodes,
  updateDiscountCode,
  deleteDiscountCode,
  mongoose
};