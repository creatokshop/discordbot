// commands/staff/close-ticket.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config.js'); // Fixed path
const { activeTickets, logTicketAction } = require('../../events/interactionCreate.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close-ticket')
        .setDescription('Close and delete a ticket (Staff only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
        
    async execute(interaction) {
        const channel = interaction.channel;
        
        // Check if this is a ticket channel
        if (!channel.name.startsWith('ticket-')) {
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

        await closeTicket(channel, interaction.user, ticketData, false);
        await interaction.reply({ content: '🔒 Closing ticket...', ephemeral: true });
    },
};

async function closeTicket(channel, closedBy, ticketData, autoClose = false) {
    try {
        // Create transcript embed for logging
        const transcriptEmbed = new EmbedBuilder()
            .setTitle(`📋 Ticket Transcript #${ticketData.ticketNumber}`)
            .setColor(0xED4245)
            .addFields(
                { 
                    name: '🎫 Ticket Information', 
                    value: `**ID:** ${ticketData.ticketNumber}\n**Created by:** <@${ticketData.userId}>\n**Created at:** ${ticketData.createdAt.toLocaleString()}`, 
                    inline: false 
                },
                { 
                    name: '🔒 Closure Information', 
                    value: `**Closed by:** ${closedBy.tag}\n**Closed at:** ${new Date().toLocaleString()}\n**Auto-closed:** ${autoClose ? 'Yes' : 'No'}`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'Ticket System' })
            .setTimestamp();

        // Send closure message
        const closureEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(`This ticket has been ${autoClose ? 'automatically ' : ''}closed by ${closedBy.tag}.`)
            .setColor(0xED4245)
            .addFields(
                { name: '📋 Summary', value: `**Ticket #${ticketData.ticketNumber}** is now closed and will be deleted shortly.`, inline: false }
            )
            .setFooter({ text: 'This channel will be deleted in 10 seconds.' });

        await channel.send({ embeds: [closureEmbed] });

        // Log ticket closure
        await logTicketAction('closed', ticketData, closedBy, channel.guild, autoClose);

        // Remove from active tickets
        activeTickets.delete(channel.id);

        // Delete channel after delay
        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (error) {
                console.error('Error deleting ticket channel:', error);
            }
        }, 10000);

    } catch (error) {
        console.error('Error closing ticket:', error);
    }
}

module.exports.closeTicket = closeTicket;