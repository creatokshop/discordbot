const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('instagram-info')
        .setDescription('Send the Instagram promotion to the designated channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const guild = await interaction.client.guilds.fetch(config.guildId);
            const instagramChannel = await guild.channels.fetch(config.channels.instagram);

            if (
                !instagramChannel ||
                ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(instagramChannel.type)
            ) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text or announcement channel. Please check your config.',
                    flags: 1 << 6
                });
            }

            const instagramEmbed = new EmbedBuilder()
                .setColor('#E1306C')
                .setTitle('📸 Follow Us on Instagram')
                .setURL('https://instagram.com/creatokshop')
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/2111/2111463.png') // Optional: IG logo
                .setDescription(`
Stay connected and inspired! 🎯

On our Instagram, you'll:
- See examples of successful accounts
- Get sneak peeks of our latest offerings
- Stay in the loop with real results and updates

📲 **Follow us today:**  
🔗 [instagram.com/creatokshop](https://instagram.com/creatokshop)
                `)
                .setFooter({
                    text: 'Creatok - Premium TikTok Services',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await instagramChannel.send({
                content: '@everyone Follow us on Instagram to stay updated!',
                embeds: [instagramEmbed]
            });

            await interaction.reply({
                content: '✅ Instagram information sent successfully to <#' + instagramChannel.id + '>!',
                flags: 1 << 6
            });

        } catch (error) {
            console.error('Error sending Instagram information:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                flags: 1 << 6
            });
        }
    },
};
