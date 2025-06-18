// // Modified index.js - original code with commented sections for testing
// const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
// const mongoose = require('mongoose');
// const fs = require('fs');
// const path = require('path');
// const { token, mongoURI } = require('./config/config');

// // Initialize Discord client with necessary intents
// const client = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMembers,
//     GatewayIntentBits.GuildMessages,
//     GatewayIntentBits.MessageContent,
//     GatewayIntentBits.GuildMessageReactions
//   ],
//   partials: [
//     Partials.Message,
//     Partials.Channel,
//     Partials.Reaction,
//     Partials.User,
//     Partials.GuildMember
//   ]
// });

// // Create collections for commands
// client.commands = new Collection();
// client.slashCommands = new Collection();
// client.buttons = new Collection();

// // UNCOMMENT THIS LINE for event handler testing
// require('./handlers/eventHandler')(client);

// // COMMENT OUT this block for testing ready.js event handler
// // client.once(Events.ClientReady, () => {
// //   console.log(`Bot is online! Logged in as ${client.user.tag}`);
// //   
// //   // Set bot status
// //   client.user.setActivity('Connection Test', { type: 'WATCHING' });
// // });

// // Discord connection error handling
// client.on(Events.Error, (error) => {
//   console.error('Discord client error:', error);
// });

// client.on(Events.ShardError, (error) => {
//   console.error('WebSocket connection error:', error);
// });

// client.on(Events.ShardDisconnect, (closeEvent) => {
//   console.log(`Bot disconnected from Discord gateway with code ${closeEvent.code}`);
// });

// client.on(Events.ShardReconnecting, () => {
//   console.log('Bot is attempting to reconnect to Discord...');
// });

// client.on(Events.ShardResume, () => {
//   console.log('Bot connection resumed successfully');
// });

// // MongoDB connection with monitoring
// // COMMENT THIS OUT for initial ready event testing
// // const connectMongoDB = async () => {
// //   try {
// //     await mongoose.connect(mongoURI);
// //     console.log('Connected to MongoDB');
// //     
// //     // Monitor MongoDB connection
// //     mongoose.connection.on('disconnected', () => {
// //       console.log('MongoDB disconnected! Attempting to reconnect...');
// //       setTimeout(connectMongoDB, 5000); // Try to reconnect after 5 seconds
// //     });
// //     
// //     mongoose.connection.on('error', (err) => {
// //       console.error('MongoDB connection error:', err);
// //       setTimeout(connectMongoDB, 5000); // Try to reconnect after 5 seconds
// //     });
// //     
// //   } catch (error) {
// //     console.error('Failed to connect to MongoDB:', error);
// //     setTimeout(connectMongoDB, 5000); // Try again after 5 seconds
// //   }
// // };

// // Initialize MongoDB connection - COMMENT OUT for initial testing
// // connectMongoDB();

// // Login to Discord with the token
// console.log('Attempting to login to Discord...');
// client.login(token).catch(error => {
//   console.error('Failed to login to Discord:', error);
//   process.exit(1); // Exit if login fails (critical error)
// });

// // Handle process errors to prevent crashes
// process.on('unhandledRejection', (error) => {
//   console.error('Unhandled promise rejection:', error);
// });

// // Add graceful shutdown
// const gracefulShutdown = async () => {
//   console.log('Shutting down gracefully...');
  
//   // Disconnect from Discord
//   client.destroy();
  
//   // Comment out MongoDB disconnect for initial testing
//   // try {
//   //   // Close MongoDB connection - updated for newer Mongoose versions
//   //   await mongoose.connection.close();
//   //   console.log('MongoDB connection closed');
//   //   process.exit(0);
//   // } catch (err) {
//   //   console.error('Error during MongoDB disconnection:', err);
//   //   process.exit(1);
//   // }
  
//   // Force exit if taking too long
//   setTimeout(() => {
//     console.error('Forcing shutdown after timeout');
//     process.exit(1);
//   }, 5000);
// };

// // Handle termination signals
// process.on('SIGINT', gracefulShutdown);
// process.on('SIGTERM', gracefulShutdown);

const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const { loadCommands, registerCommands, handleCommandInteraction } = require('./handlers/commandHandler');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');

// Check if MongoDB URI exists
const mongoURI = config.mongoURI || process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ MongoDB URI is not defined in config or environment variables.');
  console.error('Please check your config file or set the MONGODB_URI environment variable.');
  process.exit(1); // Exit if a critical configuration is missing
}

// Initialize Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember
  ]
});

// Create collections for commands
client.commands = new Collection();
client.slashCommands = new Collection();
client.buttons = new Collection();

// Load event handlers
require('./handlers/eventHandler')(client);

// Discord connection error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

client.on(Events.ShardError, (error) => {
  console.error('WebSocket connection error:', error);
});

client.on(Events.ShardDisconnect, (closeEvent) => {
  console.log(`Bot disconnected from Discord gateway with code ${closeEvent.code}`);
});

client.on(Events.ShardReconnecting, () => {
  console.log('Bot is attempting to reconnect to Discord...');
});

client.on(Events.ShardResume, () => {
  console.log('Bot connection resumed successfully');
});

//Rules Slash
client.once('ready', async () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    
    // Load commands from files
    loadCommands(client);
    
    // Register commands to Discord
    await registerCommands(client, config.guildId);
    
    console.log('🚀 Bot is ready!');
});

// Handle command interactions
handleCommandInteraction(client);

client.login(config.token);
// MongoDB connection with proper connection handling
const connectMongoDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Don't log the actual connection string to avoid exposing credentials
    // Only log that we're using it and a masked version if it exists
    if (mongoURI) {
      const maskedURI = mongoURI.includes('@') 
        ? mongoURI.replace(/mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/, 'mongodb$1://**:**@')
        : 'mongodb://<masked>';
      console.log(`Using connection string: ${maskedURI}`);
    }
    
    // Removed deprecated options: useNewUrlParser and useUnifiedTopology
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds instead of default 30
      bufferCommands: false, // Disable buffering
      bufferTimeoutMS: 30000, // Increase buffer timeout to 30 seconds
      connectTimeoutMS: 30000 // Increase connect timeout to 30 seconds
    });
    console.log('✅ Successfully connected to MongoDB');
    
    // Ensure database operations are ready
    mongoose.connection.once('open', () => {
      console.log('MongoDB connection is fully open and ready for operations');
      
      // Check server information
      mongoose.connection.db.admin().serverInfo()
        .then(info => console.log(`Connected to MongoDB version ${info.version}`))
        .catch(err => console.warn('Could not retrieve MongoDB server info:', err.message));
    });
    
    // Monitor MongoDB connection
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected! Attempting to reconnect...');
      setTimeout(connectMongoDB, 5000); // Try to reconnect after 5 seconds
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      if (err.name === 'MongoServerSelectionError') {
        console.error('Could not connect to any MongoDB server - check your connection string and network');
      }
      setTimeout(connectMongoDB, 5000); // Try to reconnect after 5 seconds
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server - check the following:');
      console.error('1. Is your MongoDB server running?');
      console.error('2. Is your connection string correct?');
      console.error('3. If using MongoDB Atlas, is your IP whitelisted?');
      console.error('4. Are there any network issues or firewalls blocking the connection?');
    }
    setTimeout(connectMongoDB, 5000); // Try again after 5 seconds
  }
};

// Initialize MongoDB connection
console.log('Initializing MongoDB connection...');
connectMongoDB();

// Login to Discord with the token
if (!config.token) {
  console.error('❌ Discord token is not defined in config file.');
  process.exit(1); // Exit if login token is missing
}

console.log('Attempting to login to Discord...');
client.login(config.token).catch(error => {
  console.error('Failed to login to Discord:', error);
  process.exit(1); // Exit if login fails (critical error)
});

// Handle process errors to prevent crashes
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Add graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  // Disconnect from Discord
  client.destroy();
  
  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
  
  // Force exit if taking too long
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 5000);
};

// Handle termination signals
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);