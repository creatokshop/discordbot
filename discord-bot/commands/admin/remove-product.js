// commands/admin/remove-product.js - Command to remove products
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadProducts, saveProducts } = require('./update-price.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-product')
        .setDescription('Remove a product from the catalog')
        .setDefaultMemberPermissions('0') // Admin only
        .addStringOption(option =>
            option.setName('product_id')
                .setDescription('Product ID to remove')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            console.log(`🔍 Remove autocomplete search: "${focusedValue}"`);
            
            const products = await loadProducts();
            
            const filtered = products.filter(product => 
                product.id.toLowerCase().includes(focusedValue.toLowerCase()) ||
                product.label.toLowerCase().includes(focusedValue.toLowerCase())
            ).slice(0, 25);

            console.log(`📋 Found ${filtered.length} matching products for removal`);

            await interaction.respond(
                filtered.map(product => ({
                    name: `${product.label} - $${product.price}`,
                    value: product.id
                }))
            );
        } catch (error) {
            console.error('❌ Error in remove autocomplete:', error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        try {
            console.log(`🗑️ Remove product command executed by ${interaction.user.tag}`);
            
            const productId = interaction.options.getString('product_id');

            console.log(`📝 Removing product: ${productId}`);

            // Load current products
            const products = await loadProducts();
            const productIndex = products.findIndex(p => p.id === productId);

            if (productIndex === -1) {
                console.log(`❌ Product not found for removal: ${productId}`);
                return await interaction.reply({
                    content: `❌ Product with ID \`${productId}\` not found.`,
                    ephemeral: true
                });
            }

            const removedProduct = products[productIndex];
            products.splice(productIndex, 1);

            await saveProducts(products);

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🗑️ Product Removed Successfully')
                .setDescription(`**${removedProduct.label}** has been removed from the catalog.`)
                .addFields(
                    { name: '🆔 Product ID', value: productId, inline: true },
                    { name: '🌍 Region', value: removedProduct.region, inline: true },
                    { name: '💰 Price', value: `$${removedProduct.price}`, inline: true },
                    { name: '📝 Type', value: removedProduct.type, inline: true },
                    { name: '📄 Description', value: removedProduct.description }
                )
                .setFooter({ text: `Removed by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: false
            });

            console.log(`✅ Product removed: ${productId} by ${interaction.user.tag}`);

        } catch (error) {
            console.error('❌ Error removing product:', error);
            await interaction.reply({
                content: '❌ Failed to remove product. Please check the console for details.',
                ephemeral: true
            });
        }
    }
};