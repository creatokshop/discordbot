const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('telegram-info')
        .setDescription('Send the Telegram promotion to the designated channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const guild = await interaction.client.guilds.fetch(config.guildId);
            const telegramChannel = await guild.channels.fetch(config.channels.telegram);

            if (
                !telegramChannel ||
                ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(telegramChannel.type)
            ) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text or announcement channel. Please check your config.',
                    flags: 1 << 6
                });
            }

            const telegramEmbed = new EmbedBuilder()
                .setColor('#0088CC')
                .setTitle('💬 Join Our Telegram Channel')
                .setURL('https://t.me/creatokshop') // Replace with your actual Telegram channel
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/2111/2111646.png') // Telegram logo
                .setDescription(`
Stay connected and never miss out! 🚀

On our Telegram channel, you'll get:
- 📢 Instant updates on new services
- 🎁 Exclusive promotions and discounts  
- ⚡ Real-time notifications
- 💎 Special member-only offers

📲 **Join us today:**

🔗 [t.me/creatokshop](https://t.me/creatokshop)
                `)
                .setFooter({
                    text: 'Creatok - Premium TikTok Services',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await telegramChannel.send({
                content: '@everyone Join our Telegram channel for instant updates and exclusive promotions!',
                embeds: [telegramEmbed]
            });

            await interaction.reply({
                content: '✅ Telegram information sent successfully to <#' + telegramChannel.id + '>!',
                flags: 1 << 6
            });

        } catch (error) {
            console.error('Error sending Telegram information:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                flags: 1 << 6
            });
        }
    },
};