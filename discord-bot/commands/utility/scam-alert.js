const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scam-alert')
        .setDescription('Send the scam alert information to the designated channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const guild = await interaction.client.guilds.fetch(config.guildId);
            const scamAlertChannel = await guild.channels.fetch(config.channels.scamAlerts);

            if (
                !scamAlertChannel ||
                ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(scamAlertChannel.type)
            ) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text or announcement channel. Please check your config.',
                    flags: 1 << 6
                });
            }

            const scamAlertEmbed = new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('⚠️ SCAM ALERT - Stay Protected!')
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/564/564619.png') // Warning shield icon
                .setDescription(`
**Be aware of impersonators!** 🚨

Verify you're dealing with official Creatok representatives:

🔒 **Official Communication Guidelines:**
• We only communicate through **official channels**
• Our team members always have the **"Creatok Staff"** role
• We **never** request payment outside our secure system
• All transactions go through our verified payment methods

🚩 **Red Flags to Watch For:**
• DMs from users without the "Creatok Staff" role
• Requests for payment via gift cards, crypto, or unusual methods
• Urgent messages claiming limited-time offers
• Poor grammar or unofficial communication style

📢 **What to Do:**
• Always verify staff identity through their role
• Report suspicious activity immediately to our moderators
• When in doubt, ask in our official support channels

**Stay safe and protect your account!** 🛡️
                `)
                .addFields(
                    {
                        name: '🚨 Report Suspicious Activity',
                        value: 'If you encounter any suspicious behavior, please report it immediately to our staff team.',
                        inline: false
                    },
                    {
                        name: '✅ Official Channels Only',
                        value: 'Remember: All official communication happens through our designated server channels.',
                        inline: false
                    }
                )
                .setFooter({
                    text: 'Creatok Security Team - Your Safety is Our Priority',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await scamAlertChannel.send({
                content: '@everyone **IMPORTANT SECURITY NOTICE** - Please read this scam alert to protect yourself!',
                embeds: [scamAlertEmbed]
            });

            await interaction.reply({
                content: '✅ Scam alert information sent successfully to <#' + scamAlertChannel.id + '>!',
                flags: 1 << 6
            });

        } catch (error) {
            console.error('Error sending scam alert information:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                flags: 1 << 6
            });
        }
    },
};