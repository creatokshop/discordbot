// commands/admin/update-price.js - Fixed Command to update product prices
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Path to store product data
const PRODUCTS_FILE = path.join(__dirname, '../../data/products.json');

// Default products based on your current setup
const DEFAULT_PRODUCTS = [
    {
        id: 'us_20k_300',
        label: 'Most Sold Product - 🇺🇸 US 20k Account',
        description: 'Non-Verified',
        region: 'US',
        type: '20k Non-Verified',
        price: 300,
        featured: true
    },
    {
        id: 'us_20k_350',
        label: '🇺🇸 US 20k Account',
        description: 'Verified',
        region: 'US',
        type: '20k Verified',
        price: 350,
        featured: false
    },
    {
        id: 'us_10k_200',
        label: '🇺🇸 US 10k Account',
        description: 'Non-Verified',
        region: 'US',
        type: '10k Non-Verified',
        price: 200,
        featured: false
    },
    {
        id: 'us_10k_250',
        label: '🇺🇸 US 10k Account',
        description: 'Verified',
        region: 'US',
        type: '10k Verified',
        price: 250,
        featured: false
    },
    {
        id: 'us_30k_400',
        label: '🇺🇸 US 30k Account',
        description: 'Non-Verified',
        region: 'US',
        type: '30k Non-Verified',
        price: 400,
        featured: false
    },
    {
        id: 'us_30k_450',
        label: '🇺🇸 US 30k Account',
        description: 'Verified',
        region: 'US',
        type: '30k Verified',
        price: 450,
        featured: false
    },
    {
        id: 'us_40k_475',
        label: '🇺🇸 US 40k Account',
        description: 'Non-Verified',
        region: 'US',
        type: '40k Non-Verified',
        price: 475,
        featured: false
    },
    {
        id: 'us_40k_500',
        label: '🇺🇸 US 40k Account',
        description: 'Verified',
        region: 'US',
        type: '40k Verified',
        price: 500,
        featured: false
    },
    {
        id: 'uk_10k_150',
        label: '🇬🇧 UK 10k Account',
        description: 'Non-Verified',
        region: 'UK',
        type: '10k Non-Verified',
        price: 150,
        featured: false
    },
    {
        id: 'uk_10k_200',
        label: '🇬🇧 UK 10k Account',
        description: 'Verified',
        region: 'UK',
        type: '10k Verified',
        price: 200,
        featured: false
    },
    {
        id: 'eu_standard_200',
        label: '🇪🇺 EU Account',
        description: 'Germany/France',
        region: 'EU',
        type: 'Germany/France',
        price: 200,
        featured: false
    },
    {
        id: 'link_bio_30',
        label: '🔗 Non-TTS Accounts',
        description: 'Non-Affiliate Accounts',
        region: 'Non-TTS',
        type: 'Non-Affiliate',
        price: 30,
        featured: false
    }
];

// Utility functions
async function loadProducts() {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(PRODUCTS_FILE);
        await fs.mkdir(dataDir, { recursive: true });

        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const products = JSON.parse(data);
        console.log(`✅ Loaded ${products.length} products from file`);
        return products;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, create it with default products
            console.log('📁 Products file not found, creating with default products...');
            await saveProducts(DEFAULT_PRODUCTS);
            return DEFAULT_PRODUCTS;
        }
        console.error('❌ Error loading products:', error);
        throw error;
    }
}

async function saveProducts(products) {
    try {
        // Ensure data directory exists
        const dataDir = path.dirname(PRODUCTS_FILE);
        await fs.mkdir(dataDir, { recursive: true });
        
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
        console.log(`✅ Saved ${products.length} products to file`);
    } catch (error) {
        console.error('❌ Error saving products:', error);
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-price')
        .setDescription('Update the price of a product')
        .setDefaultMemberPermissions('0') // Admin only
        .addStringOption(option =>
            option.setName('product_id')
                .setDescription('Product ID to update (e.g., us_20k_300)')
                .setRequired(true)
                .setAutocomplete(true))
        .addIntegerOption(option =>
            option.setName('new_price')
                .setDescription('New price for the product')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(9999)),

    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            console.log(`🔍 Autocomplete search: "${focusedValue}"`);
            
            const products = await loadProducts();
            
            const filtered = products.filter(product => 
                product.id.toLowerCase().includes(focusedValue.toLowerCase()) ||
                product.label.toLowerCase().includes(focusedValue.toLowerCase())
            ).slice(0, 25);

            console.log(`📋 Found ${filtered.length} matching products`);

            await interaction.respond(
                filtered.map(product => ({
                    name: `${product.label} - $${product.price}`,
                    value: product.id
                }))
            );
        } catch (error) {
            console.error('❌ Error in autocomplete:', error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        try {
            console.log(`🔧 Update price command executed by ${interaction.user.tag}`);
            
            const productId = interaction.options.getString('product_id');
            const newPrice = interaction.options.getInteger('new_price');

            console.log(`📝 Updating product: ${productId} to price: $${newPrice}`);

            // Load current products
            const products = await loadProducts();
            const productIndex = products.findIndex(p => p.id === productId);

            if (productIndex === -1) {
                console.log(`❌ Product not found: ${productId}`);
                return await interaction.reply({
                    content: `❌ Product with ID \`${productId}\` not found.`,
                    ephemeral: true
                });
            }

            const oldPrice = products[productIndex].price;
            products[productIndex].price = newPrice;

            // Save updated products
            await saveProducts(products);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Price Updated Successfully')
                .setDescription(`**Product:** ${products[productIndex].label}`)
                .addFields(
                    { name: '💰 Old Price', value: `$${oldPrice}`, inline: true },
                    { name: '💰 New Price', value: `$${newPrice}`, inline: true },
                    { name: '📊 Change', value: `${newPrice > oldPrice ? '+' : ''}$${newPrice - oldPrice}`, inline: true }
                )
                .setFooter({ text: `Updated by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: false
            });

            console.log(`✅ Price updated for ${productId}: $${oldPrice} → $${newPrice} by ${interaction.user.tag}`);

        } catch (error) {
            console.error('❌ Error updating price:', error);
            await interaction.reply({
                content: '❌ Failed to update price. Please check the console for details.',
                ephemeral: true
            });
        }
    },

    // Export utility functions for use in other files
    loadProducts,
    saveProducts
};