// events/messageCreate.js
// Handles messages sent in the server with random contextual emoji reactions

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    async execute(client, message) {
        try {
            // Skip if message is from a bot
            if (message.author.bot) return;
            
            // Check if message is from server owner
            const guild = message.guild;
            if (!guild || message.author.id !== guild.ownerId) return;

            // Define channel-specific emoji pools (larger pools for more variety)
            const channelEmojiPools = {
                // Welcome section
                'welcome': ['👋', '🎉', '💖', '🤗', '🌟', '✨', '🎊', '💫', '🌈', '😊', '🥳', '🎈', '🎁', '💝'],
                'rules': ['📋', '✅', '👍', '📜', '⚖️', '🛡️', '📖', '✔️', '👌', '💯', '🔒', '📄', '📝', '✍️'],
                'announcements': ['📢', '🔔', '⭐', '🗣️', '📣', '🔊', '📰', '🆕', '🚨', '⚡', '🔥', '💥'],
                'faq': ['❓', '💡', '🤔', '❔', '💭', '🧠', '🔍', '📚', '🎯', '💬', '🗨️', '📖', '🤷', '🔮'],
                
                // Purchase Information
                'how-to-buy': ['🛒', '💳', '📖', '💰', '🛍️', '💵', '💎', '🎯', '📋', '✨', '🔑', '📝', '💳', '🎁'],
                
                // Community
                'tiktok-tips': ['📱', '🎵', '💡', '🎬', '🎭', '🎪', '🎨', '🎯', '🚀', '⭐', '🔥', '💫', '✨', '🌟'],
                'growth-strategies': ['📈', '🚀', '⚡', '💪', '🎯', '🔥', '💡', '⭐', '🌟', '💎', '🏆', '👑', '💯', '🎊']
            };

            // Configuration for random selection
            const config = {
                minReactions: 3,    // Minimum number of reactions
                maxReactions: 6,    // Maximum number of reactions
                delayBetween: 300   // Delay between reactions (ms)
            };

            // Get channel name (normalize it)
            const channelName = message.channel.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove emojis and special characters
                .replace(/[\s-]+/g, '-')  // Replace spaces and multiple dashes with single dash
                .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
            
            // Get emoji pool for this channel
            const emojiPool = channelEmojiPools[channelName];
            
            if (emojiPool && emojiPool.length > 0) {
                console.log(`🎯 Server owner message detected in #${message.channel.name}`);
                console.log(`📝 Message: ${message.content.substring(0, 100)}...`);
                
                // Determine random number of reactions to add
                const numReactions = Math.floor(Math.random() * (config.maxReactions - config.minReactions + 1)) + config.minReactions;
                
                // Randomly select emojis from the pool (no duplicates)
                const selectedEmojis = getRandomEmojis(emojiPool, numReactions);
                
                console.log(`🎲 Selected ${selectedEmojis.length} random emojis: ${selectedEmojis.join(' ')}`);
                
                // Add reactions with delay to avoid rate limits
                for (let i = 0; i < selectedEmojis.length; i++) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, config.delayBetween));
                        await message.react(selectedEmojis[i]);
                        console.log(`✅ Added reaction ${selectedEmojis[i]} (${i + 1}/${selectedEmojis.length})`);
                    } catch (reactionError) {
                        console.error(`❌ Failed to add reaction ${selectedEmojis[i]}:`, reactionError.message);
                    }
                }
                
                console.log(`🎉 Finished adding ${selectedEmojis.length} random reactions to server owner message in #${message.channel.name}`);
            } else {
                console.log(`ℹ️ No emoji pool configured for channel: #${message.channel.name} (normalized: ${channelName})`);
            }
            
        } catch (error) {
            console.error('❌ Error in message reaction handler:', error);
        }
    }
};

// Helper function to get random emojis from a pool without duplicates
function getRandomEmojis(emojiPool, count) {
    // Ensure we don't request more emojis than available
    const maxCount = Math.min(count, emojiPool.length);
    
    // Create a copy of the pool to avoid modifying original
    const availableEmojis = [...emojiPool];
    const selectedEmojis = [];
    
    for (let i = 0; i < maxCount; i++) {
        // Get random index from remaining emojis
        const randomIndex = Math.floor(Math.random() * availableEmojis.length);
        
        // Add the selected emoji to results
        selectedEmojis.push(availableEmojis[randomIndex]);
        
        // Remove the selected emoji from available pool to prevent duplicates
        availableEmojis.splice(randomIndex, 1);
    }
    
    return selectedEmojis;
}

// Enhanced Channel Reaction Manager Class with randomization
class ChannelReactionManager {
    constructor() {
        this.channelEmojiPools = new Map([
            // Welcome Section
            ['welcome', { 
                emojis: ['👋', '🎉', '💖', '🤗', '🌟', '✨', '🎊', '💫', '🌈', '😊', '🥳', '🎈', '🎁', '💝'], 
                minReactions: 3, 
                maxReactions: 6, 
                delay: 300 
            }],
            ['rules', { 
                emojis: ['📋', '✅', '👍', '📜', '⚖️', '🛡️', '📖', '✔️', '👌', '💯', '🔒', '📄', '📝', '✍️'], 
                minReactions: 3, 
                maxReactions: 5, 
                delay: 300 
            }],
            ['announcements', { 
                emojis: ['📢', '🔔', '⭐', '🗣️', '📣', '🔊','📰', '🆕', '🚨', '⚡', '🔥', '💥'], 
                minReactions: 4, 
                maxReactions: 7, 
                delay: 300 
            }],
            ['faq', { 
                emojis: ['❓', '💡', '🤔', '❔', '💭', '🧠', '🔍', '📚', '🎯', '💬', '🗨️', '📖', '🤷', '🔮'], 
                minReactions: 3, 
                maxReactions: 5, 
                delay: 300 
            }],
            
            // Purchase Information
            ['how-to-buy', { 
                emojis: ['🛒', '💳', '📖', '💰', '🛍️', '💵', '💎', '🎯', '📋', '✨', '🔑', '📝', '💳', '🎁'], 
                minReactions: 4, 
                maxReactions: 6, 
                delay: 300 
            }],
            
            // Community
            ['tiktok-tips', { 
                emojis: ['📱', '🎵', '💡', '🎬', '🎭', '🎪', '🎨', '🎯', '🚀', '⭐', '🔥', '💫', '✨', '🌟'], 
                minReactions: 4, 
                maxReactions: 7, 
                delay: 300 
            }],
            ['growth-strategies', { 
                emojis: ['📈', '🚀', '⚡', '💪', '🎯', '🔥', '💡', '⭐', '🌟', '💎', '🏆', '👑', '💯', '🎊'], 
                minReactions: 4, 
                maxReactions: 8, 
                delay: 300 
            }]
        ]);
    }

    async reactToMessage(message) {
        try {
            // Use same normalization as main function
            const channelKey = message.channel.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove emojis and special characters
                .replace(/[\s-]+/g, '-')  // Replace spaces and multiple dashes with single dash
                .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
            
            const reactionConfig = this.channelEmojiPools.get(channelKey);
            
            if (!reactionConfig) {
                console.log(`ℹ️ No emoji pool configured for channel: #${message.channel.name}`);
                return;
            }

            console.log(`🎯 Adding random reactions to server owner message in #${message.channel.name}`);
            
            // Determine random number of reactions
            const numReactions = Math.floor(Math.random() * (reactionConfig.maxReactions - reactionConfig.minReactions + 1)) + reactionConfig.minReactions;
            
            // Get random emojis
            const selectedEmojis = this.getRandomEmojis(reactionConfig.emojis, numReactions);
            
            console.log(`🎲 Selected ${selectedEmojis.length} random emojis: ${selectedEmojis.join(' ')}`);
            
            for (const emoji of selectedEmojis) {
                try {
                    await new Promise(resolve => setTimeout(resolve, reactionConfig.delay));
                    await message.react(emoji);
                    console.log(`✅ Added ${emoji} reaction`);
                } catch (error) {
                    console.error(`❌ Failed to add ${emoji} reaction:`, error.message);
                }
            }
            
            console.log(`🎉 Completed ${selectedEmojis.length} random reactions for #${message.channel.name}`);
            
        } catch (error) {
            console.error('❌ Error in reactToMessage:', error);
        }
    }

    // Helper method to get random emojis
    getRandomEmojis(emojiPool, count) {
        const maxCount = Math.min(count, emojiPool.length);
        const availableEmojis = [...emojiPool];
        const selectedEmojis = [];
        
        for (let i = 0; i < maxCount; i++) {
            const randomIndex = Math.floor(Math.random() * availableEmojis.length);
            selectedEmojis.push(availableEmojis[randomIndex]);
            availableEmojis.splice(randomIndex, 1);
        }
        
        return selectedEmojis;
    }

    // Method to add new channel emoji pools
    addChannelEmojiPool(channelName, emojis, minReactions = 3, maxReactions = 6, delay = 300) {
        this.channelEmojiPools.set(channelName.toLowerCase(), { 
            emojis, 
            minReactions, 
            maxReactions, 
            delay 
        });
        console.log(`✅ Added emoji pool for #${channelName}: ${emojis.length} emojis, ${minReactions}-${maxReactions} reactions`);
    }

    // Method to update existing channel emoji pools
    updateChannelEmojiPool(channelName, emojis, minReactions = 3, maxReactions = 6, delay = 300) {
        const key = channelName.toLowerCase();
        if (this.channelEmojiPools.has(key)) {
            this.channelEmojiPools.set(key, { 
                emojis, 
                minReactions, 
                maxReactions, 
                delay 
            });
            console.log(`✅ Updated emoji pool for #${channelName}: ${emojis.length} emojis, ${minReactions}-${maxReactions} reactions`);
        } else {
            console.log(`❌ Channel #${channelName} not found in emoji pool config`);
        }
    }

    // Method to get current configuration for a channel
    getChannelConfig(channelName) {
        return this.channelEmojiPools.get(channelName.toLowerCase());
    }
}

// Export the class for use in other files
module.exports.ChannelReactionManager = ChannelReactionManager;