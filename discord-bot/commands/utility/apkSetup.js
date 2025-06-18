const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apk-setup')
        .setDescription('Send the APK download instructions to the apk-setup channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Get the apk-setup channel from config
            const guild = await interaction.client.guilds.fetch(config.guildId);
            const apkChannel = await guild.channels.fetch(config.channels.apkSetup);

            if (!apkChannel) {
                return interaction.reply({
                    content: '❌ APK Setup channel not found. Please configure it in the config file.',
                    ephemeral: true
                });
            }

            // Create the embed message
            const apkEmbed = new EmbedBuilder()
                .setColor('#FF0000') // Red color for warning
                .setTitle('📲 TikTok Mod APK Download')
                .setDescription(`
                    **Download Link:** [Telegram Channel](${config.apkDownloadLink || 'https://t.me/TikTokModCloud'})
                    
                    **Important Instructions:**
                    1. Join the Telegram channel using the link above
                    2. Follow the steps provided in the channel
                    3. Be cautious of the links you open
                    4. The app is free but contains many ads
                    5. You'll need to navigate through several links to download
                    
                    **Disclaimer:**
                    We do not own or maintain the content in the Telegram channel. 
                    Use at your own risk and be careful with the links you interact with.
                `)
                .setFooter({ text: 'APK Setup Information' });

            // Send the message
            await apkChannel.send({ embeds: [apkEmbed] });

            // Reply to the command user
            await interaction.reply({
                content: '✅ APK setup message sent successfully!',
                ephemeral: true
            });

        } catch (error) {
            console.error('Error sending APK setup message:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    },
};