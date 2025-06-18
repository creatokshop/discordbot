const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const TIPS_FILE = path.join(process.cwd(), 'data', 'growth-tips.json');
const MESSAGE_ID_FILE = path.join(process.cwd(), 'data', 'growthTipsMessageId.json');

async function loadGrowthTips() {
    try {
        await fs.mkdir(path.dirname(TIPS_FILE), { recursive: true });
        const data = await fs.readFile(TIPS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const defaultTips = {
            title: "📈 TikTok Growth Strategy Tips",
            color: "#00F2EA",
            sections: {
                content: {
                    title: "🎥 Content Strategy",
                    content: [
                        "🎯 **Hook in first 3 seconds** – Capture attention immediately",
                        "🎬 **Fast-paced edits** – Use jump cuts and motion to keep viewers engaged",
                        "📆 **Post 1-3 times daily** – Consistency is key for algorithm push",
                        "🧠 **Repurpose winning formats** – Use what's working and put your twist on it"
                    ]
                },
                optimization: {
                    title: "🔧 Optimization Techniques",
                    content: [
                        "📱 Use vertical full-screen format with good lighting",
                        "🎵 Add trending audio, but keep original voice at 80-100%",
                        "📌 Include on-screen text to boost watch time",
                        "⏱️ Optimal video length: 8–15 seconds for better completion rate"
                    ]
                },
                metrics: {
                    title: "📊 Growth Metrics to Watch",
                    content: [
                        "👁️ Focus on watch time and completion rate over views",
                        "📈 Monitor spikes in engagement after posting",
                        "📉 Avoid deleting underperforming videos unless violating guidelines",
                        "✅ Use Metricool or TikTok Analytics to evaluate trends"
                    ]
                },
                tools: {
                    title: "🧰 Recommended Tools",
                    content: [
                        "📹 **CapCut** – For quick and trendy video edits",
                        "📊 **Metricool**: https://metricool.com/tiktok-strategy/",
                        "📚 **Growth Tutorial**: https://www.youtube.com/watch?v=MBxjPb8hRws",
                        "🧠 **Content System**: https://www.youtube.com/watch?v=KOfce4lYQic",
                        "🔥 **Viral Breakdown**: https://www.tiktok.com/@samdespo/video/7489195282828102920"
                    ]
                }
            },
            footer: "Growth Command Center",
            mentionEveryone: false
        };
        await saveGrowthTips(defaultTips);
        return defaultTips;
    }
}

async function saveGrowthTips(tips) {
    try {
        await fs.writeFile(TIPS_FILE, JSON.stringify(tips, null, 2));
    } catch (error) {
        console.error('Failed to save growth tips:', error);
        throw error;
    }
}

async function loadTipsMessageId() {
    try {
        const data = await fs.readFile(MESSAGE_ID_FILE, 'utf8');
        return JSON.parse(data).tipsMessageId;
    } catch {
        return null;
    }
}

async function saveTipsMessageId(messageId) {
    try {
        await fs.writeFile(MESSAGE_ID_FILE, JSON.stringify({ tipsMessageId: messageId }, null, 2));
    } catch (error) {
        console.error('Failed to save message ID:', error);
    }
}

function createTipsEmbed(data) {
    const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setColor(data.color)
        .setFooter({ text: data.footer })
        .setTimestamp();

    for (const section of Object.values(data.sections)) {
        const content = section.content.join('\n');
        if (content.length > 1024) {
            // Split content if too long for Discord field limit
            const chunks = content.match(/[\s\S]{1,1020}(?=\n|$)/g) || [content.substring(0, 1020)];
            chunks.forEach((chunk, index) => {
                embed.addFields({
                    name: index === 0 ? section.title : `${section.title} (cont.)`,
                    value: chunk,
                    inline: false
                });
            });
        } else {
            embed.addFields({
                name: section.title,
                value: content,
                inline: false
            });
        }
    }

    return embed;
}

async function deployTips(interaction, forceNew = false) {
    try {
        const config = require('../../config/config.js');
        const guild = await interaction.client.guilds.fetch(config.guildId);
        const channel = await guild.channels.fetch(config.channels.growthTips || config.channels.general);

        if (!channel) {
            return interaction.reply({ 
                content: '❌ Tips channel not found.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const data = await loadGrowthTips();
        const embed = createTipsEmbed(data);
        const messageContent = data.mentionEveryone ? '@everyone' : '';
        let messageId = await loadTipsMessageId();

        try {
            if (messageId && !forceNew) {
                const msg = await channel.messages.fetch(messageId);
                await msg.edit({ content: messageContent, embeds: [embed] });
                return interaction.reply({ 
                    content: '✅ Growth tips updated.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        } catch (error) {
            console.log('⚠️ Message not found, sending new one...', error.message);
        }

        const newMsg = await channel.send({ content: messageContent, embeds: [embed] });
        await saveTipsMessageId(newMsg.id);
        return interaction.reply({ 
            content: '✅ Growth tips sent.', 
            flags: MessageFlags.Ephemeral 
        });
    } catch (error) {
        console.error('Error deploying tips:', error);
        return interaction.reply({ 
            content: '❌ Failed to deploy tips. Check console for details.', 
            flags: MessageFlags.Ephemeral 
        });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('growth-tips')
        .setDescription('Manage TikTok growth tips')
        .addSubcommand(sub => 
            sub.setName('deploy')
                .setDescription('Deploy or update the tips')
                .addBooleanOption(opt => 
                    opt.setName('new')
                        .setDescription('Force new message')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub => 
            sub.setName('add')
                .setDescription('Add a tip')
                .addStringOption(opt => 
                    opt.setName('section')
                        .setRequired(true)
                        .setDescription('Section to add to')
                        .addChoices(
                            { name: 'Content Strategy', value: 'content' },
                            { name: 'Optimization', value: 'optimization' },
                            { name: 'Metrics', value: 'metrics' },
                            { name: 'Tools', value: 'tools' }
                        )
                )
                .addStringOption(opt => 
                    opt.setName('content')
                        .setRequired(true)
                        .setDescription('Tip text')
                )
        )
        .addSubcommand(sub => 
            sub.setName('remove')
                .setDescription('Remove a tip')
                .addStringOption(opt => 
                    opt.setName('section')
                        .setRequired(true)
                        .setDescription('Section')
                        .addChoices(
                            { name: 'Content Strategy', value: 'content' },
                            { name: 'Optimization', value: 'optimization' },
                            { name: 'Metrics', value: 'metrics' },
                            { name: 'Tools', value: 'tools' }
                        )
                )
                .addIntegerOption(opt => 
                    opt.setName('number')
                        .setRequired(true)
                        .setDescription('Line number to remove')
                        .setMinValue(1)
                )
        )
        .addSubcommand(sub => 
            sub.setName('edit')
                .setDescription('Edit a tip')
                .addStringOption(opt => 
                    opt.setName('section')
                        .setRequired(true)
                        .setDescription('Section')
                        .addChoices(
                            { name: 'Content Strategy', value: 'content' },
                            { name: 'Optimization', value: 'optimization' },
                            { name: 'Metrics', value: 'metrics' },
                            { name: 'Tools', value: 'tools' }
                        )
                )
                .addIntegerOption(opt => 
                    opt.setName('number')
                        .setRequired(true)
                        .setDescription('Line number to edit')
                        .setMinValue(1)
                )
                .addStringOption(opt => 
                    opt.setName('newtext')
                        .setRequired(true)
                        .setDescription('New text')
                )
        )
        .addSubcommand(sub => 
            sub.setName('title')
                .setDescription('Change titles')
                .addStringOption(opt => 
                    opt.setName('type')
                        .setRequired(true)
                        .setDescription('Title to change')
                        .addChoices(
                            { name: 'Main Title', value: 'main' },
                            { name: 'Content Section', value: 'content' },
                            { name: 'Optimization Section', value: 'optimization' },
                            { name: 'Metrics Section', value: 'metrics' },
                            { name: 'Tools Section', value: 'tools' }
                        )
                )
                .addStringOption(opt => 
                    opt.setName('newtitle')
                        .setRequired(true)
                        .setDescription('New title')
                )
        )
        .addSubcommand(sub => 
            sub.setName('color')
                .setDescription('Change embed color')
                .addStringOption(opt => 
                    opt.setName('hexcolor')
                        .setRequired(true)
                        .setDescription('Hex color like #00F2EA')
                )
        )
        .addSubcommand(sub => 
            sub.setName('footer')
                .setDescription('Change footer')
                .addStringOption(opt => 
                    opt.setName('newfooter')
                        .setRequired(true)
                        .setDescription('Footer text')
                )
        )
        .addSubcommand(sub => 
            sub.setName('mention')
                .setDescription('Toggle @everyone')
                .addBooleanOption(opt => 
                    opt.setName('enable')
                        .setRequired(true)
                        .setDescription('Enable or disable @everyone')
                )
        )
        .addSubcommand(sub => 
            sub.setName('list')
                .setDescription('List current tips')
        )
        .addSubcommand(sub => 
            sub.setName('reset')
                .setDescription('Reset to default tips')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const sub = interaction.options.getSubcommand();
            const tips = await loadGrowthTips();

            const saveAndDeploy = async () => {
                await saveGrowthTips(tips);
                await deployTips(interaction);
            };

            switch (sub) {
                case 'deploy':
                    return deployTips(interaction, interaction.options.getBoolean('new') || false);

                case 'add': {
                    const section = interaction.options.getString('section');
                    const content = interaction.options.getString('content');
                    tips.sections[section].content.push(content);
                    return saveAndDeploy();
                }

                case 'remove': {
                    const section = interaction.options.getString('section');
                    const index = interaction.options.getInteger('number') - 1;
                    if (index < 0 || index >= tips.sections[section].content.length) {
                        return interaction.reply({ 
                            content: '❌ That tip number doesn\'t exist.', 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                    tips.sections[section].content.splice(index, 1);
                    return saveAndDeploy();
                }

                case 'edit': {
                    const section = interaction.options.getString('section');
                    const index = interaction.options.getInteger('number') - 1;
                    const text = interaction.options.getString('newtext');
                    if (index < 0 || index >= tips.sections[section].content.length) {
                        return interaction.reply({ 
                            content: '❌ That tip number doesn\'t exist.', 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                    tips.sections[section].content[index] = text;
                    return saveAndDeploy();
                }

                case 'title': {
                    const type = interaction.options.getString('type');
                    const newTitle = interaction.options.getString('newtitle');
                    if (type === 'main') {
                        tips.title = newTitle;
                    } else {
                        tips.sections[type].title = newTitle;
                    }
                    return saveAndDeploy();
                }

                case 'color': {
                    const color = interaction.options.getString('hexcolor');
                    if (!/^#[0-9A-F]{6}$/i.test(color)) {
                        return interaction.reply({ 
                            content: '❌ Invalid color format. Use #RRGGBB format (e.g., #00F2EA).', 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                    tips.color = color;
                    return saveAndDeploy();
                }

                case 'footer':
                    tips.footer = interaction.options.getString('newfooter');
                    return saveAndDeploy();

                case 'mention':
                    tips.mentionEveryone = interaction.options.getBoolean('enable');
                    return saveAndDeploy();

                case 'list': {
                    const embed = new EmbedBuilder()
                        .setColor('#00F2EA')
                        .setTitle('📄 Current Growth Tips Configuration')
                        .addFields(
                            { name: 'Main Title', value: tips.title, inline: true },
                            { name: 'Color', value: tips.color, inline: true },
                            { name: 'Footer', value: tips.footer, inline: true },
                            { name: 'Mention Everyone', value: tips.mentionEveryone ? 'Yes' : 'No', inline: true }
                        );

                    for (const [key, section] of Object.entries(tips.sections)) {
                        const content = section.content.map((tip, i) => `${i + 1}. ${tip}`).join('\n') || 'No tips yet.';
                        
                        if (content.length > 1024) {
                            const chunks = content.match(/[\s\S]{1,1020}(?=\n|$)/g) || [content.substring(0, 1020)];
                            chunks.forEach((chunk, index) => {
                                embed.addFields({
                                    name: index === 0 ? `${section.title} (${key})` : `${section.title} (${key}) - continued`,
                                    value: chunk,
                                    inline: false
                                });
                            });
                        } else {
                            embed.addFields({
                                name: `${section.title} (${key})`,
                                value: content,
                                inline: false
                            });
                        }
                    }

                    embed.setFooter({ text: 'Use /growth-tips edit [section] [number] [new text] to modify' });
                    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }

                case 'reset': {
                    try {
                        await fs.unlink(TIPS_FILE).catch(() => {});
                        await fs.unlink(MESSAGE_ID_FILE).catch(() => {});
                        // Recreate from default
                        await loadGrowthTips();
                        return deployTips(interaction, true);
                    } catch (error) {
                        console.error('Error resetting tips:', error);
                        return interaction.reply({ 
                            content: '❌ Failed to reset tips.', 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                }

                default:
                    return interaction.reply({ 
                        content: '❌ Unknown subcommand.', 
                        flags: MessageFlags.Ephemeral 
                    });
            }
        } catch (error) {
            console.error('Error executing growth-tips command:', error);
            
            // Check if we can still reply
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ 
                    content: '❌ An error occurred while executing the command.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }
    }
};