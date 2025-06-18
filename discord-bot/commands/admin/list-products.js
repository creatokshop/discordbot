// commands/admin/list-products.js - Command to list all products
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadProducts } = require('./update-price.js');

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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-products')
        .setDescription('List all products in the catalog')
        .setDefaultMemberPermissions('0') // Admin only
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Filter by region')
                .setRequired(false)
                .addChoices(
                    { name: 'All Regions', value: 'all' },
                    { name: 'US', value: 'US' },
                    { name: 'UK', value: 'UK' },
                    { name: 'EU', value: 'EU' },
                    { name: 'Non-TTS', value: 'Non-TTS' },
                    { name: 'Other', value: 'Other' }
                )),

    async execute(interaction) {
        try {
            console.log(`📋 List products command executed by ${interaction.user.tag}`);
            
            const regionFilter = interaction.options.getString('region') || 'all';
            
            // Load current products
            const products = await loadProducts();
            
            let filteredProducts = products;
            if (regionFilter !== 'all') {
                filteredProducts = products.filter(p => p.region === regionFilter);
            }

            console.log(`📦 Found ${filteredProducts.length} products (filter: ${regionFilter})`);

            if (filteredProducts.length === 0) {
                return await interaction.reply({
                    content: `❌ No products found${regionFilter !== 'all' ? ` for region: ${regionFilter}` : ''}.`,
                    ephemeral: true
                });
            }

            // Sort by price (ascending)
            filteredProducts.sort((a, b) => a.price - b.price);

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`📦 Product Catalog${regionFilter !== 'all' ? ` - ${regionFilter}` : ''}`)
                .setDescription(`**Total Products:** ${filteredProducts.length}`)
                .setFooter({ text: 'Creatok Product Management' })
                .setTimestamp();

            // Group products by region for better display
            const productsByRegion = {};
            filteredProducts.forEach(product => {
                if (!productsByRegion[product.region]) {
                    productsByRegion[product.region] = [];
                }
                productsByRegion[product.region].push(product);
            });

            for (const [region, regionalProducts] of Object.entries(productsByRegion)) {
                const productList = regionalProducts.map(product => 
                    `\`${product.id}\` - ${product.label}\n💰 $${product.price} | ${product.featured ? '⭐ Featured' : '📦 Standard'}`
                ).join('\n\n');

                // Discord embed field value has a 1024 character limit
                const fieldValue = productList.length > 1024 ? productList.substring(0, 1020) + '...' : productList;

                embed.addFields({
                    name: `${getRegionEmoji(region)} ${region} Products (${regionalProducts.length})`,
                    value: fieldValue,
                    inline: false
                });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

            console.log(`✅ Product list sent to ${interaction.user.tag}`);

        } catch (error) {
            console.error('❌ Error listing products:', error);
            await interaction.reply({
                content: '❌ Failed to load product list. Please check the console for details.',
                ephemeral: true
            });
        }
    }
};