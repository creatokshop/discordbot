const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tutorials-info')
        .setDescription('Send the tutorials guide to the designated channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const guild = await interaction.client.guilds.fetch(config.guildId);
            const tutorialsChannel = await guild.channels.fetch(config.channels.tutorials);

            if (
                !tutorialsChannel ||
                ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(tutorialsChannel.type)
            ) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text or announcement channel. Please check your config.',
                    flags: 1 << 6
                });
            }

            const tutorialsEmbed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle('🎓 Tutorials')
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/3003/3003035.png') // Education/tutorial icon
                .setDescription(`
Access our comprehensive video tutorials on:
• Account setup
• APK installation  
• TikTok Shop optimization
• Creativity Rewards Program maximization
• Content strategy development

## 📚 Essential Video Guides

### 🛍️ TikTok Shop Setup
📹 **Seller Setup Tutorial**: https://youtu.be/V75pUMay-kM
📹 **Additional Seller Guide**: https://youtu.be/ZTYFH01elWY

### 🎬 Creator Program
📹 **Creator Program Guide**: https://youtu.be/MdEgogmUot8

### 📈 Growth & Content Strategy
📹 **Growth Tutorial**: https://www.youtube.com/watch?v=MBxjPb8hRws
📹 **Content System**: https://www.youtube.com/watch?v=KOfce4lYQic

### 📖 Additional Resources
📖 **Viral Content Guide**: https://b9talentagency.notion.site/TikTok-Guide-fdcf2104313a4eef92c3c62d15fff891
📊 **TikTok Strategy Analytics**: https://metricool.com/tiktok-strategy/
🔥 **Viral Breakdown Example**: https://www.tiktok.com/@samdespo/video/7489195282828102920
                `)
                .setFooter({
                    text: 'Creatok Support Team - Premium TikTok Services',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await tutorialsChannel.send({
                content: 'Access all our comprehensive tutorials and guides below! 📚✨',
                embeds: [tutorialsEmbed]
            });

            await interaction.reply({
                content: '✅ Tutorials information sent successfully to <#' + tutorialsChannel.id + '>!',
                flags: 1 << 6
            });

        } catch (error) {
            console.error('Error sending tutorials information:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                flags: 1 << 6
            });
        }
    },
};