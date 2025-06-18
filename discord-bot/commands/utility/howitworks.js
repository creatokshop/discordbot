const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Helper functions for how-it-works management
async function loadHowItWorks() {
    const howItWorksDataPath = path.join(process.cwd(), 'data', 'how-it-works.json');
    try {
        await fs.mkdir(path.dirname(howItWorksDataPath), { recursive: true });
        const data = await fs.readFile(howItWorksDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const defaultHowItWorks = {
            title: "📱 HOW CREATOK SERVER WORKS",
            color: "#00D4FF",
            sections: [
                {
                    emoji: "✅",
                    title: "STEP 1: VERIFICATION OPTIONS",
                    subtitle: "Choose your preferred account type:",
                    content: [
                        "**NON-VERIFIED ACCOUNTS:**",
                        "▫️ Region-locked to country of origin",
                        "▫️ Requires matching VPN for access", 
                        "▫️ Lower cost option",
                        "▫️ Standard TikTok features",
                        "",
                        "**VERIFIED SYSTEM BYPASS:**",
                        "▫️ Our proprietary APK solution",
                        "▫️ Global access from any location",
                        "▫️ No VPN required",
                        "▫️ All verification benefits maintained",
                        "▫️ Regular updates provided"
                    ]
                },
                {
                    emoji: "🌎",
                    title: "STEP 2: SELECT YOUR REGION",
                    subtitle: "",
                    content: [
                        "**🇺🇸 US ACCOUNTS:**",
                        "▫️ Best for US-targeted content",
                        "▫️ Higher monetization potential", 
                        "▫️ Full TikTok Shop access",
                        "▫️ Full Creativity Rewards Program",
                        "",
                        "**🇬🇧 UK ACCOUNTS:**",
                        "▫️ Optimized for UK/European market",
                        "▫️ Strong e-commerce integration",
                        "▫️ Full TikTok Shop access",
                        "▫️ Full Creativity Rewards Program",
                        "",
                        "**🇪🇺 EU ACCOUNTS:**",
                        "▫️ German/French options",
                        "▫️ Growing market presence", 
                        "▫️ Full TikTok Shop access",
                        "▫️ Full Creativity Rewards Program"
                    ]
                },
                {
                    emoji: "🛍️",
                    title: "STEP 3: PLACE YOUR ORDER",
                    subtitle: "Complete the form to begin your order:",
                    content: [
                        "Go to buy-accounts to start",
                        "",
                        "**You'll need to choose:**",
                        "▫️ Selected region (US/UK/EU)",
                        "▫️ Follower count range",
                        "▫️ Verification preference",
                        "▫️ Discount code if you have one",
                        "▫️ Special requirements",
                        "",
                        "After submission,an order ticket will be created.",
                        "For assistance, tag @Creatok-Staff"
                    ]
                },
                {
                    emoji: "🔄",
                    title: "STEP 4: CONNECTION PROCESS",
                    subtitle: "After successful order ticket has been created our system will:",
                    content: [
                        "1️⃣ Assign a dedicated account manager to your order",
                        "2️⃣ Give you the payment info and final price",
                        "3️⃣ Provide order confirmation and timeline", 
                        "4️⃣ Schedule account transfer session",
                        "5️⃣ Send preliminary access instructions",
                        "",
                        "You can check your order status anytime using order ID through messaging the staff.",
                    ]
                },
                {
                    emoji: "📋",
                    title: "STEP 5: FINALIZATION",
                    subtitle: "Final steps to complete your purchase:",
                    content: [
                        "1️⃣ Review account specifications with your account manager",
                        "2️⃣ Receive secure login credentials",
                        "3️⃣ For verified accounts: Download and install custom APK",
                        "4️⃣ Complete account access verification",
                        "5️⃣ Confirm TikTok Shop and Creativity Rewards access",
                        "6️⃣ Complete customer satisfaction survey",
                        "",
                        "After completion, your 7-day support period begins",
                    ]
                }
            ],
            footer: "Creatok Support Team",
            buyAccountsChannelId: "1372017497905299537"
        };
        await saveHowItWorks(defaultHowItWorks);
        return defaultHowItWorks;
    }
}

async function saveHowItWorks(howItWorksData) {
    const howItWorksDataPath = path.join(process.cwd(), 'data', 'how-it-works.json');
    await fs.writeFile(howItWorksDataPath, JSON.stringify(howItWorksData, null, 2));
}

async function loadHowItWorksMessageId() {
    try {
        const data = await fs.readFile(path.join(process.cwd(), 'data', 'howItWorksMessageId.json'), 'utf8');
        return JSON.parse(data).howItWorksMessageId;
    } catch (error) {
        return null;
    }
}

async function saveHowItWorksMessageId(messageId) {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(
        path.join(process.cwd(), 'data', 'howItWorksMessageId.json'), 
        JSON.stringify({ howItWorksMessageId: messageId }, null, 2)
    );
}

function createHowItWorksEmbeds(howItWorksData) {
    const embeds = [];
    
    // Main title embed
    const titleEmbed = new EmbedBuilder()
        .setColor(howItWorksData.color)
        .setTitle(howItWorksData.title)
        .setDescription('Follow these steps to get your premium TikTok account:')
        .setTimestamp();
    
    embeds.push(titleEmbed);
    
    // Create embed for each section
    howItWorksData.sections.forEach((section, index) => {
        const sectionEmbed = new EmbedBuilder()
            .setColor(howItWorksData.color)
            .setTitle(`${section.emoji} ${section.title}`)
            .setDescription(section.subtitle ? section.subtitle + '\n\n' + section.content.join('\n') : section.content.join('\n'));
        
        // Add footer only to last embed
        if (index === howItWorksData.sections.length - 1) {
            sectionEmbed.setFooter({ text: howItWorksData.footer });
        }
        
        embeds.push(sectionEmbed);
    });
    
    return embeds;
}

function createSimpleRedirectMessage(buyAccountsChannelId) {
    return `🛒 **Ready to purchase?** Head to <#${buyAccountsChannelId}> to browse accounts and place your order!`;
}

async function deployHowItWorks(interaction, forceNew = false) {
    try {
        const config = require('../../config/config.js');
        const guild = await interaction.client.guilds.fetch(config.guildId);
        const howItWorksChannel = await guild.channels.fetch(config.channels.howItWorks);
        
        if (!howItWorksChannel) {
            await interaction.reply({ content: '❌ How It Works channel not found.', ephemeral: true });
            return;
        }

        const howItWorksData = await loadHowItWorks();
        const embeds = createHowItWorksEmbeds(howItWorksData);
        
        let howItWorksMessageId = await loadHowItWorksMessageId();
        
        let message;
        
        if (howItWorksMessageId && !forceNew) {
            try {
                message = await howItWorksChannel.messages.fetch(howItWorksMessageId);
                await message.edit({ embeds: embeds });
                await interaction.reply({ content: '✅ How It Works guide updated successfully!', ephemeral: true });
            } catch (error) {
                console.log('⚠️ Previous How It Works message not found, creating new one...');
                message = await howItWorksChannel.send({ embeds: embeds });
                await saveHowItWorksMessageId(message.id);
                await interaction.reply({ content: '✅ How It Works guide deployed successfully!', ephemeral: true });
            }
        } else {
            message = await howItWorksChannel.send({ embeds: embeds });
            await saveHowItWorksMessageId(message.id);
            await interaction.reply({ content: '✅ How It Works guide deployed successfully!', ephemeral: true });
        }
        
        // Send simple redirect message after the embeds
        const redirectMessage = createSimpleRedirectMessage(howItWorksData.buyAccountsChannelId || '1372017497905299537');
        await howItWorksChannel.send(redirectMessage);
        
    } catch (error) {
        console.error('Error deploying How It Works guide:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('howitworks')
        .setDescription('Manage How It Works guide')
        .addSubcommand(subcommand =>
            subcommand
                .setName('deploy')
                .setDescription('Deploy or update the How It Works guide')
                .addBooleanOption(option =>
                    option.setName('new')
                        .setDescription('Create a new message instead of updating existing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit-step')
                .setDescription('Edit a specific step')
                .addIntegerOption(option =>
                    option.setName('step')
                        .setDescription('Step number to edit (1-5)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(5)
                )
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('New title for the step')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('subtitle')
                        .setDescription('New subtitle for the step')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-content')
                .setDescription('Add content line to a step')
                .addIntegerOption(option =>
                    option.setName('step')
                        .setDescription('Step number (1-5)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(5)
                )
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Content to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-content')
                .setDescription('Remove content line from a step')
                .addIntegerOption(option =>
                    option.setName('step')
                        .setDescription('Step number (1-5)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(5)
                )
                .addIntegerOption(option =>
                    option.setName('line')
                        .setDescription('Line number to remove')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('title')
                .setDescription('Change the main title')
                .addStringOption(option =>
                    option.setName('newtitle')
                        .setDescription('New main title')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Change the embed color')
                .addStringOption(option =>
                    option.setName('hexcolor')
                        .setDescription('Hex color code (e.g., #00D4FF)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('footer')
                .setDescription('Change the footer text')
                .addStringOption(option =>
                    option.setName('newfooter')
                        .setDescription('New footer text')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-channel')
                .setDescription('Set the buy-accounts channel ID for the redirect')
                .addStringOption(option =>
                    option.setName('channelid')
                        .setDescription('Channel ID for the buy-accounts channel')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List current guide content for editing')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset guide to default content')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            const howItWorksData = await loadHowItWorks();
            
            switch (subcommand) {
                case 'deploy':
                    const forceNew = interaction.options.getBoolean('new') || false;
                    await deployHowItWorks(interaction, forceNew);
                    break;
                    
                case 'edit-step':
                    const stepNum = interaction.options.getInteger('step') - 1;
                    const newTitle = interaction.options.getString('title');
                    const newSubtitle = interaction.options.getString('subtitle');
                    
                    if (newTitle) howItWorksData.sections[stepNum].title = newTitle;
                    if (newSubtitle) howItWorksData.sections[stepNum].subtitle = newSubtitle;
                    
                    await saveHowItWorks(howItWorksData);
                    await deployHowItWorks(interaction);
                    break;
                    
                case 'add-content':
                    const addStepNum = interaction.options.getInteger('step') - 1;
                    const contentToAdd = interaction.options.getString('content');
                    
                    howItWorksData.sections[addStepNum].content.push(contentToAdd);
                    await saveHowItWorks(howItWorksData);
                    await deployHowItWorks(interaction);
                    break;
                    
                case 'remove-content':
                    const removeStepNum = interaction.options.getInteger('step') - 1;
                    const lineNum = interaction.options.getInteger('line') - 1;
                    
                    if (lineNum >= howItWorksData.sections[removeStepNum].content.length) {
                        await interaction.reply({ 
                            content: `❌ Line ${lineNum + 1} doesn't exist in step ${removeStepNum + 1}.`, 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    howItWorksData.sections[removeStepNum].content.splice(lineNum, 1);
                    await saveHowItWorks(howItWorksData);
                    await deployHowItWorks(interaction);
                    break;
                    
                case 'title':
                    const newMainTitle = interaction.options.getString('newtitle');
                    howItWorksData.title = newMainTitle;
                    await saveHowItWorks(howItWorksData);
                    await deployHowItWorks(interaction);
                    break;
                    
                case 'color':
                    const newColor = interaction.options.getString('hexcolor');
                    if (!newColor.match(/^#[0-9A-F]{6}$/i)) {
                        await interaction.reply({ 
                            content: '❌ Invalid hex color format. Please use format like #00D4FF', 
                            ephemeral: true 
                        });
                        return;
                    }
                    howItWorksData.color = newColor;
                    await saveHowItWorks(howItWorksData);
                    await deployHowItWorks(interaction);
                    break;
                    
                case 'footer':
                    const newFooter = interaction.options.getString('newfooter');
                    howItWorksData.footer = newFooter;
                    await saveHowItWorks(howItWorksData);
                    await deployHowItWorks(interaction);
                    break;
                    
                case 'set-channel':
                    const channelId = interaction.options.getString('channelid');
                    howItWorksData.buyAccountsChannelId = channelId;
                    await saveHowItWorks(howItWorksData);
                    await deployHowItWorks(interaction);
                    break;
                    
                case 'list':
                    const listEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('📝 Current How It Works Content')
                        .addFields(
                            { name: 'Main Title', value: howItWorksData.title, inline: false },
                            { name: 'Color', value: howItWorksData.color, inline: true },
                            { name: 'Footer', value: howItWorksData.footer, inline: true },
                            { name: 'Buy Accounts Channel', value: `<#${howItWorksData.buyAccountsChannelId || 'Not Set'}>`, inline: true }
                        );
                    
                    howItWorksData.sections.forEach((section, index) => {
                        const contentPreview = section.content.slice(0, 5).join('\n') + 
                            (section.content.length > 5 ? `\n... (${section.content.length - 5} more lines)` : '');
                        
                        listEmbed.addFields({
                            name: `Step ${index + 1}: ${section.title}`,
                            value: `**Subtitle:** ${section.subtitle || 'None'}\n**Content Lines:** ${section.content.length}\n\`\`\`${contentPreview}\`\`\``,
                            inline: false
                        });
                    });
                    
                    await interaction.reply({ embeds: [listEmbed], ephemeral: true });
                    break;
                    
                case 'reset':
                    const defaultData = {
                        title: "📱 HOW CREATOK SERVER WORKS",
                        color: "#00D4FF",
                        sections: [
                            {
                    emoji: "✅",
                    title: "STEP 1: VERIFICATION OPTIONS",
                    subtitle: "Choose your preferred account type:",
                    content: [
                        "**NON-VERIFIED ACCOUNTS:**",
                        "▫️ Region-locked to country of origin",
                        "▫️ Requires matching VPN for access", 
                        "▫️ Lower cost option",
                        "▫️ Standard TikTok features",
                        "",
                        "**VERIFIED SYSTEM BYPASS:**",
                        "▫️ Our proprietary APK solution",
                        "▫️ Global access from any location",
                        "▫️ No VPN required",
                        "▫️ All verification benefits maintained",
                        "▫️ Regular updates provided"
                    ]
                },
                {
                    emoji: "🌎",
                    title: "STEP 2: SELECT YOUR REGION",
                    subtitle: "",
                    content: [
                        "**🇺🇸 US ACCOUNTS:**",
                        "▫️ Best for US-targeted content",
                        "▫️ Higher monetization potential", 
                        "▫️ Full TikTok Shop access",
                        "▫️ Full Creativity Rewards Program",
                        "",
                        "**🇬🇧 UK ACCOUNTS:**",
                        "▫️ Optimized for UK/European market",
                        "▫️ Strong e-commerce integration",
                        "▫️ Full TikTok Shop access",
                        "▫️ Full Creativity Rewards Program",
                        "",
                        "**🇪🇺 EU ACCOUNTS:**",
                        "▫️ German/French options",
                        "▫️ Growing market presence", 
                        "▫️ Full TikTok Shop access",
                        "▫️ Full Creativity Rewards Program"
                    ]
                },
                {
                    emoji: "🛍️",
                    title: "STEP 3: PLACE YOUR ORDER",
                    subtitle: "Complete the form to begin your order:",
                    content: [
                        "Go to buy-accounts to start",
                        "",
                        "**You'll need to choose:**",
                        "▫️ Selected region (US/UK/EU)",
                        "▫️ Follower count range",
                        "▫️ Verification preference",
                        "▫️ Discount code if you have one",
                        "▫️ Special requirements",
                        "",
                        "After submission,an order ticket will be created.",
                        "For assistance, tag @Creatok-Staff"
                    ]
                },
                {
                    emoji: "🔄",
                    title: "STEP 4: CONNECTION PROCESS",
                    subtitle: "After successful order ticket has been created our system will:",
                    content: [
                        "1️⃣ Assign a dedicated account manager to your order",
                        "2️⃣ Give you the payment info and final price",
                        "3️⃣ Provide order confirmation and timeline", 
                        "4️⃣ Schedule account transfer session",
                        "5️⃣ Send preliminary access instructions",
                        "",
                        "You can check your order status anytime using order ID through messaging the staff.",
                    ]
                },
                {
                    emoji: "📋",
                    title: "STEP 5: FINALIZATION",
                    subtitle: "Final steps to complete your purchase:",
                    content: [
                        "1️⃣ Review account specifications with your account manager",
                        "2️⃣ Receive secure login credentials",
                        "3️⃣ For verified accounts: Download and install custom APK",
                        "4️⃣ Complete account access verification",
                        "5️⃣ Confirm TikTok Shop and Creativity Rewards access",
                        "6️⃣ Complete customer satisfaction survey",
                        "",
                        "After completion, your 7-day support period begins",
                    ]
                }
                        ],
                        footer: "Creatok Support Team",
                        buyAccountsChannelId: "1372017497905299537"
                    };
                    
                    await saveHowItWorks(defaultData);
                    await deployHowItWorks(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling How It Works command:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ An error occurred while processing your command.', 
                    ephemeral: true 
                });
            }
        }
    }
};