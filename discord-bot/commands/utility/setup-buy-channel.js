// Updated setup-buy-channel.js - Fixed deprecation warning for ephemeral responses
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, InteractionResponseType } = require('discord.js');
const { loadProducts } = require('../admin/update-price.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-buy-channel')
        .setDescription('Set up the buy-accounts channel with account listings')
        .setDefaultMemberPermissions('0'), // Admin only
    
    async execute(interaction) {
        try {
            // Load products from the database/file
            const products = await loadProducts();
            
            // Create account options for the select menu from loaded products
            const accountOptions = products.map(product => ({
                label: product.label,
                description: `${product.description} - $${product.price}`,
                value: product.id,
                emoji: product.featured ? '⭐' : undefined
            }));

            // Limit to 25 options (Discord's limit for select menus)
            const limitedOptions = accountOptions.slice(0, 25);

            // Create the select menu
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('account_selection')
                .setPlaceholder('Choose an account type')
                .addOptions(limitedOptions);

            // Create an attractive "ORDER NOW" embed with the select menu
            const orderEmbed = new EmbedBuilder()
                .setColor('#FF006E')
                .setTitle('🚀 ORDER NOW')
                .setDescription(
                    `**Ready to start your TikTok Shop journey?**\n\n` +
                    `Select your account type from the dropdown below to place your order!\n\n` +
                    `✅ Fast delivery (24 hours)\n` +
                    `✅ Premium support included\n` +
                    `✅ Money-back guarantee\n` +
                    `✅ Multiple payment options\n\n` 
                )
                .setFooter({ text: 'Creatok - Premium Account Provider' });

            // Create action row with the select menu
            const menuRow = new ActionRowBuilder().addComponents(selectMenu);

            // Add a product overview embed
            const overviewEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📦 Product Overview')
                .setDescription('Here\'s a quick overview of our available products:')
                .setTimestamp();

            // Group products by region for the overview
            const productsByRegion = {};
            products.forEach(product => {
                if (!productsByRegion[product.region]) {
                    productsByRegion[product.region] = [];
                }
                productsByRegion[product.region].push(product);
            });

            // Add fields for each region
            for (const [region, regionalProducts] of Object.entries(productsByRegion)) {
                const minPrice = Math.min(...regionalProducts.map(p => p.price));
                const maxPrice = Math.max(...regionalProducts.map(p => p.price));
                const priceRange = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`;
                
                overviewEmbed.addFields({
                    name: `${getRegionEmoji(region)} ${region} Accounts (${regionalProducts.length})`,
                    value: `Price Range: ${priceRange}\nTypes: ${regionalProducts.map(p => p.type).join(', ')}`,
                    inline: true
                });
            }

            // General chat redirect
            const redirectEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setDescription('**📝 Done reading?** Check out **#💬•general-chat**.')
                .setFooter({ text: '💡 Join the conversation!' });

            const generalChannelId = interaction.guild.channels.cache.find(c => 
                c.name.includes('general') || c.name.includes('chat')
            )?.id;

            const redirectRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setURL(`https://discord.com/channels/${interaction.guildId}/${generalChannelId || '0'}`)
                        .setLabel('💬 General Chat')
                        .setStyle(ButtonStyle.Link)
                );

            // Send all the messages - FIXED: Using flags instead of ephemeral
            await interaction.reply({
                content: '✅ Setting up buy-accounts channel...',
                flags: 64 // MessageFlags.Ephemeral
            });

            // Send the product overview
            await interaction.followUp({
                embeds: [overviewEmbed]
            });

            // Send the order section with select menu
            await interaction.followUp({
                embeds: [orderEmbed],
                components: [menuRow]
            });

            // Send the redirect section
            await interaction.followUp({
                embeds: [redirectEmbed],
                components: [redirectRow]
            });

            console.log(`✅ Buy-accounts channel setup completed by ${interaction.user.tag} with ${products.length} products`);

        } catch (error) {
            console.error('Error setting up buy-accounts channel:', error);
            
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ Failed to setup buy-accounts channel. Please try again.',
                    flags: 64 // MessageFlags.Ephemeral
                });
            } else {
                await interaction.followUp({
                    content: '❌ An error occurred during setup.',
                    flags: 64 // MessageFlags.Ephemeral
                });
            }
        }
    }
};

function getRegionEmoji(region) {
    const emojis = {
        'US': '🇺🇸',
        'UK': '🇬🇧',
        'EU': '🇪🇺',
        'Non-TTS': '🔗',
        'Other': '🌍'
    };
    return emojis[region] || '📦';
}