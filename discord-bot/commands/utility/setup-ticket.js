// commands/utility/setup-ticket.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config.js'); // Fixed path

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-ticket')
        .setDescription('Setup the ticket system panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 Support Ticket System')
            .setDescription(
                'Need help? Choose the type of support you need below.\n\n' +
                'A private channel will be created where our staff can assist you.'
            )
            .setColor(0x00AE86)
            .addFields(
                {
                    name: '🆘 General Support',
                    value: 'Questions, general help, and other inquiries',
                    inline: false
                },
                {
                    name: '🛒 Purchase Support',
                    value: 'Account purchases, payment issues, and order help',
                    inline: false
                },
                {
                    name: '🔧 Technical Support',
                    value: 'Technical issues, account problems, and troubleshooting',
                    inline: false
                },
                {
                    name: '📋 What happens next?',
                    value: '• A private channel will be created\n• Our support team will be notified\n• You can describe your issue in detail',
                    inline: false
                },
                {
                    name: '⚡ Quick Info',
                    value: '• One ticket per user at a time\n• Staff will respond as soon as possible\n• Resolved tickets auto-close after 5 minutes',
                    inline: false
                }
            )
            .setFooter({ text: 'Creatok Support Team' })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket_general')
                    .setLabel('🆘 General Support')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('create_ticket_purchase')
                    .setLabel('🛒 Purchase Support')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('create_ticket_technical')
                    .setLabel('🔧 Technical Support')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({
            content: 'Ticket system panel has been set up!',
            embeds: [embed],
            components: [buttons]
        });
    },
};