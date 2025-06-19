// commands/staff/close-ticket.js - FIXED VERSION
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config.js');
const { activeTickets, closeTicket, logTicketAction } = require('../../handlers/ticketHandlers.js'); // Fixed import path

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close-ticket')
        .setDescription('Close and delete a ticket (Staff only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        
    async execute(interaction) {
        try {
            const channel = interaction.channel;
            
            // Check if this is a ticket channel
            if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('resolved-')) {
                return interaction.reply({ 
                    content: '❌ This command can only be used in ticket channels.', 
                    ephemeral: true 
                });
            }

            // Check if user has staff role
            if (!interaction.member.roles.cache.has(config.roles.staff)) {
                return interaction.reply({ 
                    content: '❌ Only staff members can close tickets.', 
                    ephemeral: true 
                });
            }

            const ticketData = activeTickets.get(channel.id);
            if (!ticketData) {
                return interaction.reply({ 
                    content: '❌ Ticket data not found.', 
                    ephemeral: true 
                });
            }

            // IMPORTANT: Reply to the interaction FIRST
            await interaction.reply({ 
                content: '🔒 Closing ticket...', 
                ephemeral: true 
            });

            // Cancel any auto-close timeouts
            if (ticketData.autoCloseTimeout) {
                clearTimeout(ticketData.autoCloseTimeout);
                delete ticketData.autoCloseTimeout;
                console.log(`✅ Cancelled auto-close timeout for ticket #${ticketData.ticketId}`);
            }

            // Then close the ticket (this function doesn't handle interactions)
            await closeTicket(channel, ticketData, interaction.user, interaction.guild, false);
            
            console.log(`✅ Ticket #${ticketData.ticketId} closed via slash command by ${interaction.user.tag}`);

        } catch (error) {
            console.error('Error in close-ticket slash command:', error);
            
            // Only reply if we haven't already
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Error closing ticket. Please try again.',
                    ephemeral: true
                });
            }
        }
    },
};