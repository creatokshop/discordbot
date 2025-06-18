// events/ready.js
// Handles bot startup and ready state

const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    console.log(`👥 Connected to ${client.users.cache.size} users`);
    
    // Set bot status/activity (optional)
    client.user.setActivity('Creatok Community', { type: 'WATCHING' });
    
    // Log basic bot info
    console.log(`🤖 Bot ID: ${client.user.id}`);
    console.log(`🌐 Discord.js version: ${require('discord.js').version}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  },
};