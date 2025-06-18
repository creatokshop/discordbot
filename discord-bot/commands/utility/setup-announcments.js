const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Helper functions for announcements management
async function loadAnnouncements() {
    const announcementsDataPath = path.join(process.cwd(), 'data', 'announcements.json');
    try {
        await fs.mkdir(path.dirname(announcementsDataPath), { recursive: true });
        const data = await fs.readFile(announcementsDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const defaultAnnouncements = {
            title: "📣 MAY SPECIAL OFFER",
            color: "#FF5733",
            content: [
                "🔥 **30% OFF all US accounts with 30k+ followers!**",
                "🔥 **Buy 2 UK accounts, get 1 EU account FREE!**",
                "🔥 **First-time buyers: Use code `WELCOME25` for 25% off!**",
                "⏳ **Limited time offer - Expires May 20, 2025**"
            ],
            footer: "Creatok Promo Team",
            mentionEveryone: true
        };
        await saveAnnouncements(defaultAnnouncements);
        return defaultAnnouncements;
    }
}

async function saveAnnouncements(announcements) {
    const announcementsDataPath = path.join(process.cwd(), 'data', 'announcements.json');
    await fs.writeFile(announcementsDataPath, JSON.stringify(announcements, null, 2));
}

async function loadAnnouncementMessageId() {
    try {
        const data = await fs.readFile(path.join(process.cwd(), 'data', 'announcementMessageId.json'), 'utf8');
        return JSON.parse(data).announcementMessageId;
    } catch (error) {
        return null;
    }
}

async function saveAnnouncementMessageId(messageId) {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(
        path.join(process.cwd(), 'data', 'announcementMessageId.json'),
        JSON.stringify({ announcementMessageId: messageId }, null, 2)
    );
}

function createAnnouncementEmbed(announcementData) {
    const description = announcementData.content.join('\n\n');
    return new EmbedBuilder()
        .setColor(announcementData.color)
        .setTitle(announcementData.title)
        .setDescription(description)
        .setFooter({ text: announcementData.footer })
        .setTimestamp();
}

async function deployAnnouncement(interaction, forceNew = false) {
    try {
        const config = require('../../config/config.js');
        const guild = await interaction.client.guilds.fetch(config.guildId);
        const announcementsChannel = await guild.channels.fetch(config.channels.announcements);

        if (!announcementsChannel) {
            await interaction.reply({ content: '❌ Announcements channel not found.', flags: MessageFlags.Ephemeral });
            return;
        }

        const announcementData = await loadAnnouncements();
        const announcementEmbed = createAnnouncementEmbed(announcementData);
        let announcementMessageId = await loadAnnouncementMessageId();

        let message;

        if (announcementMessageId && !forceNew) {
            try {
                message = await announcementsChannel.messages.fetch(announcementMessageId);
                const messageContent = announcementData.mentionEveryone ? '@everyone' : '';
                await message.edit({ content: messageContent, embeds: [announcementEmbed] });
                await interaction.reply({ content: '✅ Announcement updated successfully!', flags: MessageFlags.Ephemeral });
                return;
            } catch (error) {
                console.log('⚠️ Previous announcement message not found, creating new one...');
            }
        }

        const messageContent = announcementData.mentionEveryone ? '@everyone' : '';
        message = await announcementsChannel.send({ content: messageContent, embeds: [announcementEmbed] });
        await saveAnnouncementMessageId(message.id);

        await interaction.reply({ content: '✅ Announcement sent successfully!', flags: MessageFlags.Ephemeral });

    } catch (error) {
        console.error('Error deploying announcement:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, flags: MessageFlags.Ephemeral });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcements')
        .setDescription('Manage server announcements')
        .addSubcommand(subcommand =>
            subcommand
                .setName('deploy')
                .setDescription('Deploy or update the announcement message')
                .addBooleanOption(option =>
                    option.setName('new')
                        .setDescription('Create a new message instead of updating existing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new line to the announcement')
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The content to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a line by number')
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
                .setDescription('Edit an existing line')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Line number to edit (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addStringOption(option =>
                    option.setName('newtext')
                        .setDescription('New text for the line')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('title')
                .setDescription('Change the announcement title')
                .addStringOption(option =>
                    option.setName('newtitle')
                        .setDescription('New title for the announcement')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Change the announcement embed color')
                .addStringOption(option =>
                    option.setName('hexcolor')
                        .setDescription('Hex color code (e.g., #FF5733)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('footer')
                .setDescription('Change the announcement footer')
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
                .setDescription('List current announcement content for editing')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset announcement to default')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            const announcementData = await loadAnnouncements();

            switch (subcommand) {
                case 'deploy':
                    const forceNew = interaction.options.getBoolean('new') || false;
                    await deployAnnouncement(interaction, forceNew);
                    break;

                case 'add':
                    const newContent = interaction.options.getString('content');
                    announcementData.content.push(newContent);
                    await saveAnnouncements(announcementData);
                    await deployAnnouncement(interaction);
                    break;

                case 'remove':
                    const removeNumber = interaction.options.getInteger('number');
                    if (removeNumber > announcementData.content.length) {
                        await interaction.reply({
                            content: `❌ Line ${removeNumber} doesn't exist. There are only ${announcementData.content.length} lines.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    announcementData.content.splice(removeNumber - 1, 1);
                    await saveAnnouncements(announcementData);
                    await deployAnnouncement(interaction);
                    break;

                case 'edit':
                    const editNumber = interaction.options.getInteger('number');
                    const newText = interaction.options.getString('newtext');

                    if (editNumber > announcementData.content.length) {
                        await interaction.reply({
                            content: `❌ Line ${editNumber} doesn't exist. There are only ${announcementData.content.length} lines.`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    announcementData.content[editNumber - 1] = newText;
                    await saveAnnouncements(announcementData);
                    await deployAnnouncement(interaction);
                    break;

                case 'title':
                    const newTitle = interaction.options.getString('newtitle');
                    announcementData.title = newTitle;
                    await saveAnnouncements(announcementData);
                    await deployAnnouncement(interaction);
                    break;

                case 'color':
                    const newColor = interaction.options.getString('hexcolor');
                    if (!newColor.match(/^#[0-9A-F]{6}$/i)) {
                        await interaction.reply({
                            content: '❌ Invalid hex color format. Please use format like #FF5733',
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                    announcementData.color = newColor;
                    await saveAnnouncements(announcementData);
                    await deployAnnouncement(interaction);
                    break;

                case 'footer':
                    const newFooter = interaction.options.getString('newfooter');
                    announcementData.footer = newFooter;
                    await saveAnnouncements(announcementData);
                    await deployAnnouncement(interaction);
                    break;

                case 'mention':
                    const enableMention = interaction.options.getBoolean('enable');
                    announcementData.mentionEveryone = enableMention;
                    await saveAnnouncements(announcementData);
                    await deployAnnouncement(interaction);
                    break;

                case 'list':
                    const contentList = announcementData.content.map((line, index) =>
                        `${index + 1}. ${line}`
                    ).join('\n');

                    const listEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('📝 Current Announcement Content (for editing)')
                        .addFields(
                            { name: 'Title', value: announcementData.title, inline: true },
                            { name: 'Color', value: announcementData.color, inline: true },
                            { name: 'Footer', value: announcementData.footer, inline: true },
                            { name: 'Mention Everyone', value: announcementData.mentionEveryone ? 'Yes' : 'No', inline: true },
                            { name: 'Content Lines', value: contentList || 'No content found.' }
                        )
                        .setFooter({ text: 'Use /announcements edit [number] [new text] to modify a line' });

                    await interaction.reply({ embeds: [listEmbed], flags: MessageFlags.Ephemeral });
                    break;

                case 'reset':
                    const defaultAnnouncements = {
                        title: "📣 MAY SPECIAL OFFER",
                        color: "#FF5733",
                        content: [
                            "🔥 **30% OFF all US accounts with 30k+ followers!**",
                            "🔥 **Buy 2 UK accounts, get 1 EU account FREE!**",
                            "🔥 **First-time buyers: Use code `WELCOME25` for 25% off!**",
                            "⏳ **Limited time offer - Expires May 20, 2025**"
                        ],
                        footer: "Creatok Promo Team",
                        mentionEveryone: true
                    };
                    await saveAnnouncements(defaultAnnouncements);
                    await deployAnnouncement(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling announcements command:', error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your command.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
};