const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB connection string from environment variables or config
const connectionString = process.env.MONGODB_URI;
let isDbConnected = false;

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tag: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  region: { type: String, enum: ['us', 'uk', 'eu', 'none'], default: 'none' },
  purchases: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});

// Create the model
const User = mongoose.model('User', userSchema);

// Function to check if database is connected
const isConnected = () => {
  return isDbConnected && mongoose.connection.readyState === 1;
};

// Function to connect to MongoDB
const connectToDatabase = async () => {
  try {
    if (!connectionString) {
      console.error('❌ MongoDB URI is not defined in environment variables');
      console.error('Please set MONGODB_URI in your .env file');
      return false;
    }
    
    // Log a masked version of the connection string for debugging
    const maskedURI = connectionString.includes('@') 
      ? connectionString.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://**:**@')
      : 'mongodb://<masked>';
    console.log(`Attempting to connect to MongoDB...`);
    console.log(`Using connection string: ${maskedURI}`);
    
    // Connect to MongoDB with proper options (removed deprecated options)
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds
      connectTimeoutMS: 30000 // Connection timeout
    });
    
    console.log('✅ Successfully connected to MongoDB');
    isDbConnected = true;
    
    // Setup event listeners for connection monitoring
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected! Attempting to reconnect...');
      isDbConnected = false;
      setTimeout(connectToDatabase, 5000); // Try to reconnect after 5 seconds
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isDbConnected = false;
      setTimeout(connectToDatabase, 5000); // Try to reconnect after 5 seconds
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
    
    setTimeout(connectToDatabase, 5000); // Try again after 5 seconds
    return false;
  }
};

// Function to get existing user or create new one
const getOrCreateUser = async (userData) => {
  if (!isConnected()) {
    console.warn('Attempted to access database while disconnected');
    await connectToDatabase();
    if (!isConnected()) {
      throw new Error('Database connection not available');
    }
  }

  try {
    // Find existing user by Discord ID
    let user = await User.findOne({ id: userData.id });
    
    // If user doesn't exist, create a new one
    if (!user) {
      user = new User({
        id: userData.id,
        tag: userData.tag,
        joinedAt: userData.joinedAt || new Date(),
        region: userData.region || 'none'
      });
      await user.save();
      console.log(`Created new user in database: ${userData.tag}`);
    } else {
      // Update last active timestamp
      user.lastActive = new Date();
      // Update tag if it has changed
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

// Function to update user region preference
const updateUserRegion = async (userId, region) => {
  if (!isConnected()) {
    console.warn('Attempted to access database while disconnected');
    await connectToDatabase();
    if (!isConnected()) {
      throw new Error('Database connection not available');
    }
  }

  try {
    const validRegions = ['us', 'uk', 'eu', 'none'];
    if (!validRegions.includes(region)) {
      throw new Error(`Invalid region: ${region}`);
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      { region, lastActive: new Date() },
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

// Export all the functions
module.exports = {
  connectToDatabase,
  getOrCreateUser,
  updateUserRegion,
  isConnected,
  mongoose,
  User
};