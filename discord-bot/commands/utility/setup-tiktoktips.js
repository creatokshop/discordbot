const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Helper functions for TikTok tips management
async function loadTikTokTips() {
    const tipsDataPath = path.join(process.cwd(), 'data', 'tiktok-tips.json');
    try {
        await fs.mkdir(path.dirname(tipsDataPath), { recursive: true });
        const data = await fs.readFile(tipsDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const defaultTips = {
            title: "📱 TikTok Account Usage Tips",
            color: "#FF0050",
            sections: {
                security: {
                    title: "🔒 Security Tips After Purchase",
                    content: [
                        "⏰ **Wait 72 hours** - TikTok needs time to recognize your device as trustworthy",
                        "🌐 **IP Address Changes** - Avoid follows, likes, and posts for a week after IP change",
                        "👤 **Username Changes** - Don't change username for a week (looks suspicious to TikTok)",
                        "📱 **Follow these steps to avoid account restrictions**"
                    ]
                },
                seller: {
                    title: "🛍️ TikTok Shop for Sellers",
                    content: [
                        "1️⃣ Go to TikTok Shop for Seller and click 'Sign up with TikTok account'",
                        "📄 Upload your USA passport or driving license for verification",
                        "🏪 Set up your remote website or shop within TikTok Shop",
                        "📦 Add products that you think will generate sales"
                    ]
                },
                creator: {
                    title: "🎬 TikTok Shop for Creators",
                    content: [
                        "📝 Apply for TikTok Shop Creator program with your account info",
                        "⚠️ **Important**: Application may be rejected first time due to new IP/device",
                        "⏳ Wait 24 hours, then reapply 3-4 times until accepted",
                        "🔑 This process must be done from YOUR phone/location for account security"
                    ]
                },
                resources: {
                    title: "📚 Helpful Resources",
                    content: [
                        "📹 **Seller Setup Tutorial**: https://youtu.be/V75pUMay-kM",
                        "📹 **Additional Seller Guide**: https://youtu.be/ZTYFH01elWY",
                        "📹 **Creator Program Guide**: https://youtu.be/MdEgogmUot8",
                        "📖 **Viral Content Guide**: https://b9talentagency.notion.site/TikTok-Guide-fdcf2104313a4eef92c3c62d15fff891"
                    ]
                }
            },
            footer: "Creatok Support Team",
            mentionEveryone: false
        };
        await saveTikTokTips(defaultTips);
        return defaultTips;
    }
}

async function saveTikTokTips(tips) {
    const tipsDataPath = path.join(process.cwd(), 'data', 'tiktok-tips.json');
    await fs.writeFile(tipsDataPath, JSON.stringify(tips, null, 2));
}

async function loadTipsMessageId() {
    try {
        const data = await fs.readFile(path.join(process.cwd(), 'data', 'tiktokTipsMessageId.json'), 'utf8');
        return JSON.parse(data).tipsMessageId;
    } catch (error) {
        return null;
    }
}

async function saveTipsMessageId(messageId) {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(
        path.join(process.cwd(), 'data', 'tiktokTipsMessageId.json'),
        JSON.stringify({ tipsMessageId: messageId }, null, 2)
    );
}

function createTipsEmbed(tipsData) {
    const embed = new EmbedBuilder()
        .setColor(tipsData.color)
        .setTitle(tipsData.title)
        .setFooter({ text: tipsData.footer })
        .setTimestamp();

    // Add each section as a field
    Object.values(tipsData.sections).forEach(section => {
        const fieldValue = section.content.join('\n');
        embed.addFields({
            name: section.title,
            value: fieldValue,
            inline: false
        });
    });

    return embed;
}

async function deployTips(interaction, forceNew = false) {
    try {
        const config = require('../../config/config.js');
        const guild = await interaction.client.guilds.fetch(config.guildId);
        const tipsChannel = await guild.channels.fetch(config.channels.tiktokTips || config.channels.general);

        if (!tipsChannel) {
            await interaction.reply({ content: '❌ Tips channel not found.', flags: MessageFlags.Ephemeral });
            return;
        }

        const tipsData = await loadTikTokTips();
        const tipsEmbed = createTipsEmbed(tipsData);
        let tipsMessageId = await loadTipsMessageId();

        let message;

        if (tipsMessageId && !forceNew) {
            try {
                message = await tipsChannel.messages.fetch(tipsMessageId);
                const messageContent = tipsData.mentionEveryone ? '@everyone' : '';
                await message.edit({ content: messageContent, embeds: [tipsEmbed] });
                await interaction.reply({ content: '✅ TikTok tips updated successfully!', flags: MessageFlags.Ephemeral });
                return;
            } catch (error) {
                console.log('⚠️ Previous tips message not found, creating new one...');
            }
        }

        const messageContent = tipsData.mentionEveryone ? '@everyone' : '';
        message = await tipsChannel.send({ content: messageContent, embeds: [tipsEmbed] });
        await saveTipsMessageId(message.id);

        await interaction.reply({ content: '✅ TikTok tips sent successfully!', flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error deploying TikTok tips:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tiktok-tips')
        .setDescription('Manage TikTok usage tips and guides')
        .addSubcommand(subcommand =>
            subcommand
                .setName('deploy')
                .setDescription('Deploy or update the TikTok tips message')
                .addBooleanOption(option =>
                    option.setName('new')
                        .setDescription('Create a new message instead of updating existing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new tip to a section')
                .addStringOption(option =>
                    option.setName('section')
                        .setDescription('Which section to add to')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Security Tips', value: 'security' },
                            { name: 'Seller Tips', value: 'seller' },
                            { name: 'Creator Tips', value: 'creator' },
                            { name: 'Resources', value: 'resources' }
                        )
                )
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The tip content to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a tip by section and line number')
                .addStringOption(option =>
                    option.setName('section')
                        .setDescription('Which section to remove from')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Security Tips', value: 'security' },
                            { name: 'Seller Tips', value: 'seller' },
                            { name: 'Creator Tips', value: 'creator' },
                            { name: 'Resources', value: 'resources' }
                        )
                )
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Line number to remove (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing tip')
                .addStringOption(option =>
                    option.setName('section')
                        .setDescription('Which section to edit')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Security Tips', value: 'security' },
                            { name: 'Seller Tips', value: 'seller' },
                            { name: 'Creator Tips', value: 'creator' },
                            { name: 'Resources', value: 'resources' }
                        )
                )
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Line number to edit (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addStringOption(option =>
                    option.setName('newtext')
                        .setDescription('New text for the tip')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('title')
                .setDescription('Change the main title or section title')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('What title to change')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Main Title', value: 'main' },
                            { name: 'Security Section', value: 'security' },
                            { name: 'Seller Section', value: 'seller' },
                            { name: 'Creator Section', value: 'creator' },
                            { name: 'Resources Section', value: 'resources' }
                        )
                )
                .addStringOption(option =>
                    option.setName('newtitle')
                        .setDescription('New title text')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Change the embed color')
                .addStringOption(option =>
                    option.setName('hexcolor')
                        .setDescription('Hex color code (e.g., #FF0050)')
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
                .setDescription('List current tips content for editing')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset tips to default content')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            const tipsData = await loadTikTokTips();

            switch (subcommand) {
                case 'deploy':
                    const forceNew = interaction.options.getBoolean('new') || false;
                    await deployTips(interaction, forceNew);
                    break;

                case 'add':
                    const addSection = interaction.options.getString('section');
                    const newContent = interaction.options.getString('content');
                    tipsData.sections[addSection].content.push(newContent);
                    await saveTikTokTips(tipsData);
                    await deployTips(interaction);
                    break;

                case 'remove':
                    const removeSection = interaction.options.getString('section');
                    const removeNumber = interaction.options.getInteger('number');
                    const sectionContent = tipsData.sections[removeSection].content;
                    
                    if (removeNumber > sectionContent.length) {
                        await interaction.reply({
                            content: `❌ Line ${removeNumber} doesn't exist in ${removeSection}. There are only ${sectionContent.length} lines.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    sectionContent.splice(removeNumber - 1, 1);
                    await saveTikTokTips(tipsData);
                    await deployTips(interaction);
                    break;

                case 'edit':
                    const editSection = interaction.options.getString('section');
                    const editNumber = interaction.options.getInteger('number');
                    const newText = interaction.options.getString('newtext');
                    const editSectionContent = tipsData.sections[editSection].content;

                    if (editNumber > editSectionContent.length) {
                        await interaction.reply({
                            content: `❌ Line ${editNumber} doesn't exist in ${editSection}. There are only ${editSectionContent.length} lines.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    editSectionContent[editNumber - 1] = newText;
                    await saveTikTokTips(tipsData);
                    await deployTips(interaction);
                    break;

                case 'title':
                    const titleType = interaction.options.getString('type');
                    const newTitle = interaction.options.getString('newtitle');
                    
                    if (titleType === 'main') {
                        tipsData.title = newTitle;
                    } else {
                        tipsData.sections[titleType].title = newTitle;
                    }
                    
                    await saveTikTokTips(tipsData);
                    await deployTips(interaction);
                    break;

                case 'color':
                    const newColor = interaction.options.getString('hexcolor');
                    if (!newColor.match(/^#[0-9A-F]{6}$/i)) {
                        await interaction.reply({
                            content: '❌ Invalid hex color format. Please use format like #FF0050',
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                    tipsData.color = newColor;
                    await saveTikTokTips(tipsData);
                    await deployTips(interaction);
                    break;

                case 'footer':
                    const newFooter = interaction.options.getString('newfooter');
                    tipsData.footer = newFooter;
                    await saveTikTokTips(tipsData);
                    await deployTips(interaction);
                    break;

                case 'mention':
                    const enableMention = interaction.options.getBoolean('enable');
                    tipsData.mentionEveryone = enableMention;
                    await saveTikTokTips(tipsData);
                    await deployTips(interaction);
                    break;

                case 'list':
                    const listEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('📝 Current TikTok Tips Content (for editing)')
                        .addFields(
                            { name: 'Main Title', value: tipsData.title, inline: true },
                            { name: 'Color', value: tipsData.color, inline: true },
                            { name: 'Footer', value: tipsData.footer, inline: true },
                            { name: 'Mention Everyone', value: tipsData.mentionEveryone ? 'Yes' : 'No', inline: true }
                        );

                    // Add each section's content
                    Object.entries(tipsData.sections).forEach(([key, section]) => {
                        const contentList = section.content.map((line, index) =>
                            `${index + 1}. ${line}`
                        ).join('\n');
                        
                        listEmbed.addFields({
                            name: `${section.title} (${key})`,
                            value: contentList || 'No content found.',
                            inline: false
                        });
                    });

                    listEmbed.setFooter({ text: 'Use /tiktok-tips edit [section] [number] [new text] to modify' });

                    await interaction.reply({ embeds: [listEmbed], flags: MessageFlags.Ephemeral });
                    break;

                case 'reset':
                    const defaultTips = {
                        title: "📱 TikTok Account Usage Tips",
                        color: "#FF0050",
                        sections: {
                            security: {
                                title: "🔒 Security Tips After Purchase",
                                content: [
                                    "⏰ **Wait 72 hours** - TikTok needs time to recognize your device as trustworthy",
                                    "🌐 **IP Address Changes** - Avoid follows, likes, and posts for a week after IP change",
                                    "👤 **Username Changes** - Don't change username for a week (looks suspicious to TikTok)",
                                    "📱 **Follow these steps to avoid account restrictions**"
                                ]
                            },
                            seller: {
                                title: "🛍️ TikTok Shop for Sellers",
                                content: [
                                    "1️⃣ Go to TikTok Shop for Seller and click 'Sign up with TikTok account'",
                                    "📄 Upload your USA passport or driving license for verification",
                                    "🏪 Set up your remote website or shop within TikTok Shop",
                                    "📦 Add products that you think will generate sales"
                                ]
                            },
                            creator: {
                                title: "🎬 TikTok Shop for Creators",
                                content: [
                                    "📝 Apply for TikTok Shop Creator program with your account info",
                                    "⚠️ **Important**: Application may be rejected first time due to new IP/device",
                                    "⏳ Wait 24 hours, then reapply 3-4 times until accepted",
                                    "🔑 This process must be done from YOUR phone/location for account security"
                                ]
                            },
                            resources: {
                                title: "📚 Helpful Resources",
                                content: [
                                    "📹 **Seller Setup Tutorial**: https://youtu.be/V75pUMay-kM",
                                    "📹 **Additional Seller Guide**: https://youtu.be/ZTYFH01elWY",
                                    "📹 **Creator Program Guide**: https://youtu.be/MdEgogmUot8",
                                    "📖 **Viral Content Guide**: https://b9talentagency.notion.site/TikTok-Guide-fdcf2104313a4eef92c3c62d15fff891"
                                ]
                            }
                        },
                        footer: "Creatok Support Team",
                        mentionEveryone: false
                    };
                    await saveTikTokTips(defaultTips);
                    await deployTips(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling tiktok-tips command:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your command.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
};