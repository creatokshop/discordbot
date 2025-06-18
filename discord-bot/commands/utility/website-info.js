const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('website-info')
        .setDescription('Send the website information to the designated channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const guild = await interaction.client.guilds.fetch(config.guildId);
            const websiteChannel = await guild.channels.fetch(config.channels.website);

            if (
                !websiteChannel ||
                ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(websiteChannel.type)
            ) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text or announcement channel. Please check your config.',
                    flags: 1 << 6
                });
            }

            const websiteEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🌐 Creatok Official Website')
                .setURL('https://creatok.shop')
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setDescription(`
**Welcome to Creatok!** 🎉

We're excited to announce our official website where you can:
- Browse all available services
- Place instant orders with your specific requirements
- Get faster processing times
- Enjoy a seamless ordering experience

**📌 Important Notice:**
For the best experience, we recommend placing orders directly through our website:
🔗 [creatok.shop](https://creatok.shop)

However, if you prefer, you can still place orders through our Discord server. Both options are available!

**Why order through the website?**
✅ Instant order processing  
✅ Clear requirements specification  
✅ Automated status updates  
✅ 24/7 availability`)
                .addFields(
                    {
                        name: 'Website Orders',
                        value: '[Place Order Now](https://creatok.shop) - Fastest processing',
                        inline: true
                    },
                    {
                        name: 'Discord Orders',
                        value: 'Open a ticket in <#1372017497905299537> - Traditional method',
                        inline: true
                    },
                    {
                        name: 'Need Help?',
                        value: 'Visit our FAQ channel: <#1372016216566403083>',
                        inline: false
                    }
                )
                .setFooter({
                    text: 'Creatok - Premium TikTok Services',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await websiteChannel.send({
                content: '@everyone Check out our new website for faster ordering!',
                embeds: [websiteEmbed]
            });

            await interaction.reply({
                content: '✅ Website information sent successfully to <#1379490656648560761>!',
                flags: 1 << 6
            });

        } catch (error) {
            console.error('Error sending website information:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                flags: 1 << 6
            });
        }
    },
};
