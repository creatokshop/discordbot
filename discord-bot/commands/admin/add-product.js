// commands/admin/add-product.js - Command to add new products
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadProducts, saveProducts } = require('./update-price.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-product')
        .setDescription('Add a new product to the catalog')
        .setDefaultMemberPermissions('0') // Admin only
        .addStringOption(option =>
            option.setName('product_id')
                .setDescription('Unique product ID (e.g., us_50k_600)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('label')
                .setDescription('Product display name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Product description')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Product region')
                .setRequired(true)
                .addChoices(
                    { name: 'US', value: 'US' },
                    { name: 'UK', value: 'UK' },
                    { name: 'EU', value: 'EU' },
                    { name: 'Non-TTS', value: 'Non-TTS' },
                    { name: 'Other', value: 'Other' }
                ))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Account type (e.g., 50k Verified)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('price')
                .setDescription('Product price')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(9999))
        .addBooleanOption(option =>
            option.setName('featured')
                .setDescription('Mark as featured product')
                .setRequired(false)),

    async execute(interaction) {
        try {
            console.log(`➕ Add product command executed by ${interaction.user.tag}`);
            
            const productId = interaction.options.getString('product_id');
            const label = interaction.options.getString('label');
            const description = interaction.options.getString('description');
            const region = interaction.options.getString('region');
            const type = interaction.options.getString('type');
            const price = interaction.options.getInteger('price');
            const featured = interaction.options.getBoolean('featured') || false;

            console.log(`📝 Adding product: ${productId} - ${label} ($${price})`);

            // Load current products
            const products = await loadProducts();

            // Check if product ID already exists
            if (products.find(p => p.id === productId)) {
                console.log(`❌ Product ID already exists: ${productId}`);
                return await interaction.reply({
                    content: `❌ Product with ID \`${productId}\` already exists.`,
                    ephemeral: true
                });
            }

            // Create new product
            const newProduct = {
                id: productId,
                label,
                description,
                region,
                type,
                price,
                featured,
                createdAt: new Date().toISOString(),
                createdBy: interaction.user.id
            };

            products.push(newProduct);
            await saveProducts(products);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Product Added Successfully')
                .setDescription(`**${label}** has been added to the catalog!`)
                .addFields(
                    { name: '🆔 Product ID', value: productId, inline: true },
                    { name: '🌍 Region', value: region, inline: true },
                    { name: '💰 Price', value: `$${price}`, inline: true },
                    { name: '📝 Type', value: type, inline: true },
                    { name: '⭐ Featured', value: featured ? 'Yes' : 'No', inline: true },
                    { name: '📄 Description', value: description }
                )
                .setFooter({ text: `Added by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: false
            });

            console.log(`✅ New product added: ${productId} by ${interaction.user.tag}`);

        } catch (error) {
            console.error('❌ Error adding product:', error);
            await interaction.reply({
                content: '❌ Failed to add product. Please check the console for details.',
                ephemeral: true
            });
        }
    }
};