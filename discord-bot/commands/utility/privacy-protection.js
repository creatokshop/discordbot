const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('privacy-protection')
        .setDescription('Send the privacy protection information to the designated channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            const guild = await interaction.client.guilds.fetch(config.guildId);
            const privacyChannel = await guild.channels.fetch(config.channels.privacyProtection);

            if (
                !privacyChannel ||
                ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(privacyChannel.type)
            ) {
                return interaction.reply({
                    content: '❌ The specified channel is not a text or announcement channel. Please check your config.',
                    flags: 1 << 6
                });
            }

            const privacyEmbed = new EmbedBuilder()
                .setColor('#4A90E2')
                .setTitle('👁️ Privacy Protection - Your Data is Safe')
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/3064/3064197.png') // Privacy/shield icon
                .setDescription(`
**We prioritize your privacy above all else!** 🔒

At Creatok, your personal information and data security are our top priorities. Here's how we protect you:

🛡️ **Complete Confidentiality:**
• All transactions are **100% confidential**
• Account details are **securely transferred** using encrypted protocols
• Personal information is **never shared** with third parties
• Payment data is **fully encrypted** and protected

🔐 **Data Security Measures:**
• Advanced encryption for all sensitive data
• Secure servers with industry-standard protection
• No unauthorized access to your information
• Regular security audits and updates

✨ **Post-Transfer Privacy:**
• **No tracking or monitoring** after account transfer
• Your account becomes completely yours
• We don't retain access to transferred accounts
• Full privacy restoration upon completion

📋 **Our Privacy Promise:**
We believe in complete transparency about how we handle your data. Your trust is earned through our actions, not just our words.
                `)
                .addFields(
                    {
                        name: '🔒 Data Encryption',
                        value: 'All your sensitive information is protected with military-grade encryption technology.',
                        inline: true
                    },
                    {
                        name: '🚫 Zero Tracking',
                        value: 'Once your account is transferred, we maintain zero access or monitoring capabilities.',
                        inline: true
                    },
                    {
                        name: '🤝 Trust & Transparency',
                        value: 'Our privacy practices are designed to give you complete peace of mind.',
                        inline: true
                    }
                )
                .setFooter({
                    text: 'Creatok Privacy Team - Your Privacy, Our Priority',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await privacyChannel.send({
                content: '🔒 **PRIVACY NOTICE** - Learn about how we protect your personal information and data!',
                embeds: [privacyEmbed]
            });

            await interaction.reply({
                content: '✅ Privacy protection information sent successfully to <#' + privacyChannel.id + '>!',
                flags: 1 << 6
            });

        } catch (error) {
            console.error('Error sending privacy protection information:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                flags: 1 << 6
            });
        }
    },
};