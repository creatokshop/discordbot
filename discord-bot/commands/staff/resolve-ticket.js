// commands/staff/resolve-ticket.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config/config.js'); // Fixed path
const { activeTickets, logTicketAction } = require('../../handlers/ticketHandlers.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resolve-ticket')
        .setDescription('Mark the current support ticket as resolved')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        try {
            const channelId = interaction.channel.id;
            const ticketData = activeTickets.get(channelId);

            if (!ticketData) {
                return interaction.reply({
                    content: '❌ This command can only be used in ticket channels.',
                    ephemeral: true
                });
            }

            // Check if user has staff role or is ticket owner
            const hasStaffRole = interaction.member.roles.cache.has(config.roles.staff);
            const isTicketOwner = ticketData.userId === interaction.user.id;

            if (!hasStaffRole && !isTicketOwner) {
                return interaction.reply({
                    content: '❌ Only staff members or the ticket creator can resolve tickets.',
                    ephemeral: true
                });
            }

            if (ticketData.status === 'resolved') {
                return interaction.reply({
                    content: '❌ This ticket is already resolved.',
                    ephemeral: true
                });
            }

            // Update ticket status
            ticketData.status = 'resolved';
            ticketData.resolvedBy = interaction.user.tag;
            ticketData.resolvedAt = new Date();

            // Create resolved embed
            const resolvedEmbed = new EmbedBuilder()
                .setTitle(`✅ Ticket #${ticketData.ticketId} - RESOLVED`)
                .setDescription(
                    `This ticket has been marked as resolved by ${interaction.user}.\n\n` +
                    `**Resolution Details:**\n` +
                    `• Resolved by: ${interaction.user.tag}\n` +
                    `• Resolved at: <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                    `*This ticket will be automatically closed in 5 minutes if no further action is needed.*`
                )
                .setColor(0x57F287)
                .setFooter({ text: 'Ticket will auto-close in 5 minutes' })
                .setTimestamp();

            // Update channel name to show resolved status
            await interaction.channel.setName(`resolved-${ticketData.ticketId}`);

            await interaction.reply({
                embeds: [resolvedEmbed]
            });

            // Log resolution
            await logTicketAction('resolved', ticketData, interaction.user, interaction.guild);

            // Auto-close after 5 minutes
            setTimeout(async () => {
                try {
                    const currentTicketData = activeTickets.get(channelId);
                    if (currentTicketData && currentTicketData.status === 'resolved') {
                        // Update status and close
                        currentTicketData.status = 'closed';
                        currentTicketData.closedBy = 'System (Auto-close)';
                        currentTicketData.closedAt = new Date();

                        await logTicketAction('closed', currentTicketData, interaction.user, interaction.guild, true);
                        
                        activeTickets.delete(channelId);
                        await interaction.channel.delete('Ticket auto-closed after resolution');
                        console.log(`✅ Ticket #${ticketData.ticketId} auto-closed after resolution`);
                    }
                } catch (error) {
                    console.error('Error in auto-close:', error);
                }
            }, 5 * 60 * 1000); // 5 minutes

            console.log(`✅ Ticket #${ticketData.ticketId} resolved by ${interaction.user.tag}`);

        } catch (error) {
            console.error('Error in resolve-ticket command:', error);
            
            if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred while resolving the ticket.',
                    ephemeral: true
                });
            }
        }
    }
};