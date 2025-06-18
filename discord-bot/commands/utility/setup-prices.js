const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Helper functions for prices management
async function loadPrices() {
    const pricesDataPath = path.join(process.cwd(), 'data', 'prices.json');
    try {
        await fs.mkdir(path.dirname(pricesDataPath), { recursive: true });
        const data = await fs.readFile(pricesDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const defaultPrices = {
            title: "🔥CREATOK PRICE LIST",
            color: "#00D084",
            footer: "Creatok Sales Team • All prices in USD",
            mentionEveryone: false,
            products: [
                {
                    label: 'Most Sold Product - 🇺🇸 US 20k Account',
                    description: 'Non-Verified - $300',
                    value: 'us_20k_300'
                },
                {
                    label: '🇺🇸 US 20k Account',
                    description: 'Verified - $350',
                    value: 'us_20k_350'
                },
                {
                    label: '🇺🇸 US 10k Account',
                    description: 'Non-Verified - $200',
                    value: 'us_10k_200'
                },
                {
                    label: '🇺🇸 US 10k Account',
                    description: 'Verified - $250',
                    value: 'us_10k_250'
                },
                {
                    label: '🇺🇸 US 30k Account',
                    description: 'Non-Verified - $400',
                    value: 'us_30k_400'
                },
                {
                    label: '🇺🇸 US 30k Account',
                    description: 'Verified - $450',
                    value: 'us_30k_450'
                },
                {
                    label: '🇺🇸 US 40k Account',
                    description: 'Non-Verified - $475',
                    value: 'us_40k_475'
                },
                {
                    label: '🇺🇸 US 40k Account',
                    description: 'Verified - $500',
                    value: 'us_40k_500'
                },
                {
                    label: '🇬🇧 UK 10k Account',
                    description: 'Non-Verified - $150',
                    value: 'uk_10k_150'
                },
                {
                    label: '🇬🇧 UK 10k Account',
                    description: 'Verified - $200',
                    value: 'uk_10k_200'
                },
                {
                    label: '🇪🇺 EU Account',
                    description: 'Germany/France - $200',
                    value: 'eu_standard_200'
                },
                {
                    label: '🔗 Non-TTS Accounts',
                    description: 'Non-Affiliate Accounts - $30',
                    value: 'link_bio_30'
                }
            ]
        };
        await savePrices(defaultPrices);
        return defaultPrices;
    }
}

async function savePrices(prices) {
    const pricesDataPath = path.join(process.cwd(), 'data', 'prices.json');
    await fs.writeFile(pricesDataPath, JSON.stringify(prices, null, 2));
}

async function loadPricesMessageId() {
    try {
        const data = await fs.readFile(path.join(process.cwd(), 'data', 'pricesMessageId.json'), 'utf8');
        return JSON.parse(data).pricesMessageId;
    } catch (error) {
        return null;
    }
}

async function savePricesMessageId(messageId) {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(
        path.join(process.cwd(), 'data', 'pricesMessageId.json'), 
        JSON.stringify({ pricesMessageId: messageId }, null, 2)
    );
}

function createPricesEmbed(pricesData) {
    const embed = new EmbedBuilder()
        .setColor(pricesData.color)
        .setTitle(pricesData.title)
        .setFooter({ text: pricesData.footer })
        .setTimestamp()
        .setDescription('**Premium TikTok Accounts**\nAll accounts come with lifetime warranty and 24/7 support');

    // Group products by category for better organization
    const usProducts = pricesData.products.filter(p => p.label.includes('🇺🇸'));
    const ukProducts = pricesData.products.filter(p => p.label.includes('🇬🇧'));
    const euProducts = pricesData.products.filter(p => p.label.includes('🇪🇺'));
    const otherProducts = pricesData.products.filter(p => !p.label.includes('🇺🇸') && !p.label.includes('🇬🇧') && !p.label.includes('🇪🇺'));

    if (usProducts.length > 0) {
        const usContent = usProducts.map(product => 
            `• ${product.label.replace('🇺🇸 US', '').trim()} - ${product.description}`
        ).join('\n');
        embed.addFields({ 
            name: '**🇺🇸 United States Accounts**', 
            value: usContent, 
            inline: false 
        });
    }

    if (ukProducts.length > 0) {
        const ukContent = ukProducts.map(product => 
            `• ${product.label.replace('🇬🇧 UK', '').trim()} - ${product.description}`
        ).join('\n');
        embed.addFields({ 
            name: '**🇬🇧 United Kingdom Accounts**', 
            value: ukContent, 
            inline: false 
        });
    }

    if (euProducts.length > 0) {
        const euContent = euProducts.map(product => 
            `• ${product.label.replace('🇪🇺 EU', '').trim()} - ${product.description}`
        ).join('\n');
        embed.addFields({ 
            name: '**🇪🇺 European Union Accounts**', 
            value: euContent, 
            inline: false 
        });
    }

    if (otherProducts.length > 0) {
        const otherContent = otherProducts.map(product => 
            `• ${product.label} - ${product.description}`
        ).join('\n');
        embed.addFields({ 
            name: '** Other Products**', 
            value: otherContent, 
            inline: false 
        });
    }

    // Add a final note
    embed.addFields({
        name: '\u200B',
        value: '💬 **Need help?** Contact our sales team for custom orders or bulk discounts!',
        inline: false
    });

    return embed;
}
async function deployPrices(interaction, forceNew = false) {
    try {
        const config = require('../../config/config.js');
        const guild = await interaction.client.guilds.fetch(config.guildId);
        
        // Updated to use pricingdetails channel first, then fallback to others
        const pricesChannel = await guild.channels.fetch(
            config.channels.pricingdetails || 
            config.channels.prices || 
            config.channels.announcements
        );
        
        if (!pricesChannel) {
            await interaction.reply({ 
                content: '❌ Prices channel not found.', 
                flags: 64 // This replaces ephemeral: true
            });
            return;
        }

        const pricesData = await loadPrices();
        const pricesEmbed = createPricesEmbed(pricesData);
        let pricesMessageId = await loadPricesMessageId();
        
        let message;
        
        if (pricesMessageId && !forceNew) {
            try {
                message = await pricesChannel.messages.fetch(pricesMessageId);
                const messageContent = pricesData.mentionEveryone ? '@everyone' : '';
                await message.edit({ content: messageContent, embeds: [pricesEmbed] });
                await interaction.reply({ 
                    content: '✅ Prices updated successfully!', 
                    flags: 64 // This replaces ephemeral: true
                });
                return;
            } catch (error) {
                console.log('⚠️ Previous prices message not found, creating new one...');
            }
        }
        
        const messageContent = pricesData.mentionEveryone ? '@everyone' : '';
        message = await pricesChannel.send({ content: messageContent, embeds: [pricesEmbed] });
        await savePricesMessageId(message.id);
        
        await interaction.reply({ 
            content: '✅ Prices sent successfully!', 
            flags: 64 // This replaces ephemeral: true
        });
        
    } catch (error) {
        console.error('Error deploying prices:', error);
        await interaction.reply({ 
            content: `❌ Error: ${error.message}`, 
            flags: 64 // This replaces ephemeral: true
        });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prices')
        .setDescription('Manage server pricing information')
        .addSubcommand(subcommand =>
            subcommand
                .setName('deploy')
                .setDescription('Deploy or update the prices message')
                .addBooleanOption(option =>
                    option.setName('new')
                        .setDescription('Create a new message instead of updating existing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new product to the price list')
                .addStringOption(option =>
                    option.setName('label')
                        .setDescription('Product name/label')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Product description and price')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('value')
                        .setDescription('Unique identifier for the product')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a product by number')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Product number to remove (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing product')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Product number to edit (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addStringOption(option =>
                    option.setName('field')
                        .setDescription('Field to edit')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Label', value: 'label' },
                            { name: 'Description', value: 'description' },
                            { name: 'Value', value: 'value' }
                        )
                )
                .addStringOption(option =>
                    option.setName('newtext')
                        .setDescription('New text for the field')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('title')
                .setDescription('Change the prices title')
                .addStringOption(option =>
                    option.setName('newtitle')
                        .setDescription('New title for the prices')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Change the prices embed color')
                .addStringOption(option =>
                    option.setName('hexcolor')
                        .setDescription('Hex color code (e.g., #00D084)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('footer')
                .setDescription('Change the prices footer')
                .addStringOption(option =>
                    option.setName('newfooter')
                        .setDescription('New footer text')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('mention')
                .setDescription('Toggle @everyone mention')
                .addBooleanOption(option =>
                    option.setName('enable')
                        .setDescription('Enable or disable @everyone mention')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List current products for editing')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset prices to default')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            const pricesData = await loadPrices();
            
            switch (subcommand) {
                case 'deploy':
                    const forceNew = interaction.options.getBoolean('new') || false;
                    await deployPrices(interaction, forceNew);
                    break;
                    
                case 'add':
                    const newLabel = interaction.options.getString('label');
                    const newDescription = interaction.options.getString('description');
                    const newValue = interaction.options.getString('value');
                    
                    pricesData.products.push({
                        label: newLabel,
                        description: newDescription,
                        value: newValue
                    });
                    
                    await savePrices(pricesData);
                    await deployPrices(interaction);
                    break;
                    
                case 'remove':
                    const removeNumber = interaction.options.getInteger('number');
                    if (removeNumber > pricesData.products.length) {
                        await interaction.reply({ 
                            content: `❌ Product ${removeNumber} doesn't exist. There are only ${pricesData.products.length} products.`, 
                            flags: 64 // This replaces ephemeral: true
                        });
                        return;
                    }
                    
                    pricesData.products.splice(removeNumber - 1, 1);
                    await savePrices(pricesData);
                    await deployPrices(interaction);
                    break;
                    
                case 'edit':
                    const editNumber = interaction.options.getInteger('number');
                    const editField = interaction.options.getString('field');
                    const newText = interaction.options.getString('newtext');
                    
                    if (editNumber > pricesData.products.length) {
                        await interaction.reply({ 
                            content: `❌ Product ${editNumber} doesn't exist. There are only ${pricesData.products.length} products.`, 
                            flags: 64 // This replaces ephemeral: true
                        });
                        return;
                    }
                    
                    pricesData.products[editNumber - 1][editField] = newText;
                    await savePrices(pricesData);
                    await deployPrices(interaction);
                    break;
                    
                case 'title':
                    const newTitle = interaction.options.getString('newtitle');
                    pricesData.title = newTitle;
                    await savePrices(pricesData);
                    await deployPrices(interaction);
                    break;
                    
                case 'color':
                    const newColor = interaction.options.getString('hexcolor');
                    if (!newColor.match(/^#[0-9A-F]{6}$/i)) {
                        await interaction.reply({ 
                            content: '❌ Invalid hex color format. Please use format like #00D084', 
                            flags: 64 // This replaces ephemeral: true
                        });
                        return;
                    }
                    pricesData.color = newColor;
                    await savePrices(pricesData);
                    await deployPrices(interaction);
                    break;
                    
                case 'footer':
                    const newFooter = interaction.options.getString('newfooter');
                    pricesData.footer = newFooter;
                    await savePrices(pricesData);
                    await deployPrices(interaction);
                    break;
                    
                case 'mention':
                    const enableMention = interaction.options.getBoolean('enable');
                    pricesData.mentionEveryone = enableMention;
                    await savePrices(pricesData);
                    await deployPrices(interaction);
                    break;
                    
                case 'list':
                    const productsList = pricesData.products.map((product, index) => 
                        `${index + 1}. **${product.label}** - ${product.description} (${product.value})`
                    ).join('\n');
                    
                    const listEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('📝 Current Products List (for editing)')
                        .addFields(
                            { name: 'Title', value: pricesData.title, inline: true },
                            { name: 'Color', value: pricesData.color, inline: true },
                            { name: 'Footer', value: pricesData.footer, inline: true },
                            { name: 'Mention Everyone', value: pricesData.mentionEveryone ? 'Yes' : 'No', inline: true },
                            { name: 'Products', value: productsList || 'No products found.' }
                        )
                        .setFooter({ text: 'Use /prices edit [number] [field] [new text] to modify a product' });
                    
                    await interaction.reply({ 
                        embeds: [listEmbed], 
                        flags: 64 // This replaces ephemeral: true
                    });
                    break;
                    
                case 'reset':
                    const defaultPrices = {
                        title: "🔥CREATOK PRICE LIST",
                        color: "#00D084",
                        footer: "Creatok Sales Team • All prices in USD",
                        mentionEveryone: false,
                        products: [
                            {
                                label: 'Most Sold Product - 🇺🇸 US 20k Account',
                                description: 'Non-Verified - $300',
                                value: 'us_20k_300'
                            },
                            {
                                label: '🇺🇸 US 20k Account',
                                description: 'Verified - $350',
                                value: 'us_20k_350'
                            },
                            {
                                label: '🇺🇸 US 10k Account',
                                description: 'Non-Verified - $200',
                                value: 'us_10k_200'
                            },
                            {
                                label: '🇺🇸 US 10k Account',
                                description: 'Verified - $250',
                                value: 'us_10k_250'
                            },
                            {
                                label: '🇺🇸 US 30k Account',
                                description: 'Non-Verified - $400',
                                value: 'us_30k_400'
                            },
                            {
                                label: '🇺🇸 US 30k Account',
                                description: 'Verified - $450',
                                value: 'us_30k_450'
                            },
                            {
                                label: '🇺🇸 US 40k Account',
                                description: 'Non-Verified - $475',
                                value: 'us_40k_475'
                            },
                            {
                                label: '🇺🇸 US 40k Account',
                                description: 'Verified - $500',
                                value: 'us_40k_500'
                            },
                            {
                                label: '🇬🇧 UK 10k Account',
                                description: 'Non-Verified - $150',
                                value: 'uk_10k_150'
                            },
                            {
                                label: '🇬🇧 UK 10k Account',
                                description: 'Verified - $200',
                                value: 'uk_10k_200'
                            },
                            {
                                label: '🇪🇺 EU Account',
                                description: 'Germany/France - $200',
                                value: 'eu_standard_200'
                            },
                            {
                                label: '🔗 Non-TTS Accounts',
                                description: 'Non-Affiliate Accounts - $30',
                                value: 'link_bio_30'
                            }
                        ]
                    };
                    await savePrices(defaultPrices);
                    await deployPrices(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling prices command:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ An error occurred while processing your command.', 
                    flags: 64 // This replaces ephemeral: true
                });
            }
        }
    },
};