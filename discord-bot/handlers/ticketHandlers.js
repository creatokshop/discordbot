// handlers/ticketHandlers.js - Complete ticket system handler
const { EmbedBuilder, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config.js');

// In-memory storage for active tickets (consider moving to database.js later)
const activeTickets = new Map();
let ticketCounter = 1000; // Start from 1000 for better ticket numbers

/**
 * Main ticket interaction handler
 */
async function handleTicketInteraction(interaction) {
    if (!interaction.isButton()) return false;

    const { customId } = interaction;
    console.log(`Button clicked: ${customId} by ${interaction.user.tag}`);

    // Handle different ticket creation types
    if (customId === 'create_ticket_general') {
        await handleCreateTicket(interaction, 'general', '🆘 General Support');
        return true;
    }

    if (customId === 'create_ticket_purchase') {
        await handleCreateTicket(interaction, 'purchase', '🛒 Purchase Support');
        return true;
    }

    if (customId === 'create_ticket_technical') {
        await handleCreateTicket(interaction, 'technical', '🔧 Technical Support');
        return true;
    }

    // Handle legacy create_ticket button (for backwards compatibility)
    if (customId === 'create_ticket') {
        await handleCreateTicket(interaction, 'general', '🆘 General Support');
        return true;
    }

    // Handle ticket closing
    if (customId === 'close_ticket') {
        await handleCloseTicket(interaction);
        return true;
    }

    // Handle ticket resolution
    if (customId === 'resolve_ticket') {
        await handleResolveTicket(interaction);
        return true;
    }

    return false;
}

/**
 * Handle ticket creation
 */
async function handleCreateTicket(interaction, ticketType = 'general', ticketTypeName = '🆘 General Support') {
    try {
        await interaction.deferReply({ flags: 64 }); // 64 = EPHEMERAL flag

        // Check if user already has an open ticket
        const existingTicket = Array.from(activeTickets.values()).find(
            ticket => ticket.userId === interaction.user.id && ticket.status === 'open'
        );

        if (existingTicket) {
            return interaction.editReply({
                content: `❌ You already have an open ticket: <#${existingTicket.channelId}>`
            });
        }

        await createTicket(interaction, ticketType, ticketTypeName);

    } catch (error) {
        console.error('Error in handleCreateTicket:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ There was an error creating your ticket. Please try again later.',
                flags: 64 // EPHEMERAL flag
            });
        } else {
            await interaction.editReply({
                content: '❌ There was an error creating your ticket. Please try again later.'
            });
        }
    }
}

/**
 * Create a new support ticket
 * @param {*} interaction - The interaction object
 * @param {string} ticketType - Type of ticket (general, purchase, technical)
 * @param {string} ticketTypeName - Display name for ticket type
 */
async function createTicket(interaction, ticketType = 'general', ticketTypeName = '🆘 General Support') {
    const guild = interaction.guild;
    const user = interaction.user;
    
    // Generate ticket number
    const ticketNumber = ++ticketCounter;
    
    // Get the existing support category - try multiple fallback options
    let supportCategory = guild.channels.cache.get(config.channels.supportCategory) || 
                         guild.channels.cache.get(config.channels.ticketCategory);
    
    // If still not found, try to find by name
    if (!supportCategory) {
        supportCategory = guild.channels.cache.find(channel => 
            channel.type === ChannelType.GuildCategory && 
            (channel.name.toLowerCase().includes('support') || channel.name.toLowerCase().includes('ticket'))
        );
    }
    
    // Last resort: create a new category if none found
    if (!supportCategory) {
        try {
            supportCategory = await guild.channels.create({
                name: '📋 Support Tickets',
                type: ChannelType.GuildCategory,
            });
            console.log(`✅ Created new support category: ${supportCategory.id}`);
        } catch (error) {
            console.error('Error creating support category:', error);
            throw new Error('Failed to find or create support category');
        }
    }

    console.log(`✅ Using existing support category: ${supportCategory.name} (${supportCategory.id})`);
    
    // Create private ticket channel in the existing support category
    const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: supportCategory.id,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles
                ],
            },
            {
                id: config.roles.staff,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.ManageMessages
                ],
            }
        ],
    });

    // Store ticket data
    const ticketData = {
        ticketId: ticketNumber,
        userId: user.id,
        channelId: ticketChannel.id,
        createdAt: new Date(),
        status: 'open',
        createdBy: user.tag,
        type: ticketType
    };
    
    activeTickets.set(ticketChannel.id, ticketData);
    console.log(`✅ Stored ticket data for channel ${ticketChannel.id}:`, ticketData);

    // Create ticket control buttons
    const ticketControls = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('resolve_ticket')
                .setLabel('✅ Mark Resolved')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('🔒 Close Ticket')
                .setStyle(ButtonStyle.Danger)
        );

    // Create welcome embed
    const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎫 ${ticketTypeName} - Ticket #${ticketNumber}`)
        .setDescription(
            `Hello ${user}, welcome to your support ticket!\n\n` +
            `Please describe your issue in detail and our staff team will assist you shortly.\n\n` +
            `**What can we help you with today?**\n` +
            `• Account purchase questions\n` +
            `• Technical support\n` +
            `• Order inquiries\n` +
            `• General assistance\n\n` +
            `*A staff member will be with you soon!*`
        )
        .setColor(0x00AE86)
        .addFields(
            { 
                name: '📋 Ticket Information', 
                value: `**Ticket ID:** #${ticketNumber}\n**Type:** ${ticketTypeName}\n**Created by:** ${user.tag}\n**Status:** 🟢 Open\n**Created:** <t:${Math.floor(Date.now() / 1000)}:R>`, 
                inline: false 
            },
            { 
                name: '🔧 Staff Controls', 
                value: `Use the buttons below to manage this ticket`, 
                inline: false 
            }
        )
        .setFooter({ text: 'Creatok Support Team', iconURL: guild.iconURL() })
        .setTimestamp();

    // Send welcome message with controls
    await ticketChannel.send({
        content: `${user} | <@&${config.roles.staff}>`,
        embeds: [welcomeEmbed],
        components: [ticketControls]
    });

    // Log ticket creation
    await logTicketAction('created', ticketData, user, guild);

    // Check if interaction was deferred or replied to
    if (interaction.deferred) {
        await interaction.editReply({
            content: `✅ Your support ticket has been created: ${ticketChannel}\n\n*Click the channel link above to access your ticket.*`
        });
    } else if (!interaction.replied) {
        await interaction.reply({
            content: `✅ Your support ticket has been created: ${ticketChannel}\n\n*Click the channel link above to access your ticket.*`,
            ephemeral: true
        });
    }

    console.log(`✅ Ticket #${ticketNumber} created by ${user.tag} in channel ${ticketChannel.name}`);
}

/**
 * Handle ticket resolution
 */
async function handleResolveTicket(interaction) {
    try {
        const channelId = interaction.channel.id;
        console.log(`Resolving ticket in channel: ${channelId}`);
        console.log(`Active tickets:`, Array.from(activeTickets.keys()));
        
        const ticketData = activeTickets.get(channelId);

        if (!ticketData) {
            console.log(`No ticket data found for channel ${channelId}`);
            return interaction.reply({
                content: '❌ This is not a valid ticket channel.',
                flags: 64 // EPHEMERAL flag
            });
        }

        // Check if user has staff role or is ticket owner
        const hasStaffRole = interaction.member.roles.cache.has(config.roles.staff);
        const isTicketOwner = ticketData.userId === interaction.user.id;

        console.log(`User ${interaction.user.tag} - Staff: ${hasStaffRole}, Owner: ${isTicketOwner}`);

        if (!hasStaffRole && !isTicketOwner) {
            return interaction.reply({
                content: '❌ Only staff members or the ticket creator can resolve tickets.',
                flags: 64 // EPHEMERAL flag
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
                    await autoCloseTicket(interaction.channel, ticketData, interaction.user, interaction.guild);
                }
            } catch (error) {
                console.error('Error in auto-close:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes

        console.log(`✅ Ticket #${ticketData.ticketId} resolved by ${interaction.user.tag}`);

    } catch (error) {
        console.error('Error in handleResolveTicket:', error);
        
        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Error resolving ticket. Please try again.',
                ephemeral: true
            });
        }
    }
}

/**
 * Handle manual ticket closing
 */
async function handleCloseTicket(interaction) {
    try {
        const channelId = interaction.channel.id;
        console.log(`Closing ticket in channel: ${channelId}`);
        
        const ticketData = activeTickets.get(channelId);

        if (!ticketData) {
            console.log(`No ticket data found for channel ${channelId}`);
            return interaction.reply({
                content: '❌ This is not a valid ticket channel.',
                ephemeral: true
            });
        }

        // Check if user has staff role or is ticket owner
        const hasStaffRole = interaction.member.roles.cache.has(config.roles.staff);
        const isTicketOwner = ticketData.userId === interaction.user.id;

        if (!hasStaffRole && !isTicketOwner) {
            return interaction.reply({
                content: '❌ Only staff members or the ticket creator can close tickets.',
                ephemeral: true
            });
        }

        await closeTicket(interaction.channel, ticketData, interaction.user, interaction.guild, false);

        console.log(`✅ Ticket #${ticketData.ticketId} closed by ${interaction.user.tag}`);

    } catch (error) {
        console.error('Error in handleCloseTicket:', error);
        
        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Error closing ticket. Please try again.',
                ephemeral: true
            });
        }
    }
}

/**
 * Close a ticket (manual or auto)
 */
async function closeTicket(channel, ticketData, user, guild, isAutoClose = false) {
    try {
        // Update ticket status
        ticketData.status = 'closed';
        ticketData.closedBy = user.tag;
        ticketData.closedAt = new Date();

        // Send closing message
        const closingEmbed = new EmbedBuilder()
            .setTitle(`🔒 Ticket #${ticketData.ticketId} - CLOSED`)
            .setDescription(
                `This ticket has been ${isAutoClose ? 'automatically ' : ''}closed by ${user}.\n\n` +
                `**Ticket Summary:**\n` +
                `• Created by: <@${ticketData.userId}> (${ticketData.createdBy})\n` +
                `• Created at: <t:${Math.floor(ticketData.createdAt.getTime() / 1000)}:F>\n` +
                `• Closed by: ${user.tag}\n` +
                `• Closed at: <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                `*This channel will be deleted in 10 seconds.*`
            )
            .setColor(0xED4245)
            .setFooter({ text: 'Thank you for using Creatok Support' })
            .setTimestamp();

        await channel.send({
            embeds: [closingEmbed]
        });

        // Log closure
        await logTicketAction('closed', ticketData, user, guild, isAutoClose);

        // Store channel ID for deletion check
        const channelId = channel.id;

        // Delete channel after 10 seconds with proper error handling
        setTimeout(async () => {
            try {
                // Check if channel still exists before attempting deletion
                const channelToDelete = guild.channels.cache.get(channelId);
                
                if (!channelToDelete) {
                    console.log(`⚠️ Channel ${channelId} no longer exists, skipping deletion`);
                    activeTickets.delete(channelId);
                    return;
                }

                // Verify the channel is still the same type and accessible
                if (channelToDelete.type !== ChannelType.GuildText) {
                    console.log(`⚠️ Channel ${channelId} is not a text channel, skipping deletion`);
                    activeTickets.delete(channelId);
                    return;
                }

                // Check if bot has permission to delete the channel
                const botMember = guild.members.cache.get(guild.client.user.id);
                if (!channelToDelete.permissionsFor(botMember)?.has(PermissionsBitField.Flags.ManageChannels)) {
                    console.log(`⚠️ No permission to delete channel ${channelId}`);
                    activeTickets.delete(channelId);
                    return;
                }

                // Attempt deletion
                await channelToDelete.delete('Ticket closed');
                console.log(`✅ Ticket channel #${ticketData.ticketId} deleted successfully`);
                
                // Clean up from active tickets after successful deletion
                activeTickets.delete(channelId);
                
            } catch (error) {
                console.error(`Error deleting ticket channel ${channelId}:`, error);
                
                // Handle specific Discord API errors
                if (error.code === 10003) { // Unknown Channel
                    console.log(`⚠️ Channel ${channelId} was already deleted, cleaning up data`);
                } else if (error.code === 50013) { // Missing Permissions
                    console.log(`⚠️ Missing permissions to delete channel ${channelId}`);
                } else if (error.code === 50001) { // Missing Access
                    console.log(`⚠️ Missing access to channel ${channelId}`);
                }
                
                // Clean up from active tickets regardless of deletion success
                activeTickets.delete(channelId);
            }
        }, 10000);

    } catch (error) {
        console.error('Error in closeTicket:', error);
        throw error;
    }
}

/**
 * Auto-close resolved ticket with additional safety checks
 */
async function autoCloseTicket(channel, ticketData, user, guild) {
    try {
        // Double-check that the channel still exists before auto-closing
        const currentChannel = guild.channels.cache.get(channel.id);
        if (!currentChannel) {
            console.log(`⚠️ Channel ${channel.id} no longer exists, skipping auto-close`);
            activeTickets.delete(channel.id);
            return;
        }

        // Verify ticket is still in resolved state
        const currentTicketData = activeTickets.get(channel.id);
        if (!currentTicketData || currentTicketData.status !== 'resolved') {
            console.log(`⚠️ Ticket ${ticketData.ticketId} is no longer in resolved state, skipping auto-close`);
            return;
        }

        await closeTicket(currentChannel, ticketData, user, guild, true);
    } catch (error) {
        console.error('Error in autoCloseTicket:', error);
        // Clean up ticket data even if auto-close fails
        activeTickets.delete(channel.id);
    }
}

/**
 * Enhanced ticket resolution with better timeout handling
 */
async function handleResolveTicket(interaction) {
    try {
        const channelId = interaction.channel.id;
        console.log(`Resolving ticket in channel: ${channelId}`);
        
        const ticketData = activeTickets.get(channelId);

        if (!ticketData) {
            console.log(`No ticket data found for channel ${channelId}`);
            return interaction.reply({
                content: '❌ This is not a valid ticket channel.',
                flags: 64 // EPHEMERAL flag
            });
        }

        // Check if user has staff role or is ticket owner
        const hasStaffRole = interaction.member.roles.cache.has(config.roles.staff);
        const isTicketOwner = ticketData.userId === interaction.user.id;

        console.log(`User ${interaction.user.tag} - Staff: ${hasStaffRole}, Owner: ${isTicketOwner}`);

        if (!hasStaffRole && !isTicketOwner) {
            return interaction.reply({
                content: '❌ Only staff members or the ticket creator can resolve tickets.',
                flags: 64 // EPHEMERAL flag
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
        try {
            await interaction.channel.setName(`resolved-${ticketData.ticketId}`);
        } catch (error) {
            console.log(`⚠️ Could not rename channel: ${error.message}`);
        }

        await interaction.reply({
            embeds: [resolvedEmbed]
        });

        // Log resolution
        await logTicketAction('resolved', ticketData, interaction.user, interaction.guild);

        // Store timeout ID for potential cancellation
        const timeoutId = setTimeout(async () => {
            try {
                await autoCloseTicket(interaction.channel, ticketData, interaction.user, interaction.guild);
            } catch (error) {
                console.error('Error in auto-close timeout:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Store timeout ID in ticket data for potential cancellation
        ticketData.autoCloseTimeout = timeoutId;

        console.log(`✅ Ticket #${ticketData.ticketId} resolved by ${interaction.user.tag}`);

    } catch (error) {
        console.error('Error in handleResolveTicket:', error);
        
        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Error resolving ticket. Please try again.',
                ephemeral: true
            });
        }
    }
}

/**
 * Enhanced manual ticket closing with timeout cancellation
 */
async function handleCloseTicket(interaction) {
    try {
        const channelId = interaction.channel.id;
        console.log(`Closing ticket in channel: ${channelId}`);
        
        const ticketData = activeTickets.get(channelId);

        if (!ticketData) {
            console.log(`No ticket data found for channel ${channelId}`);
            return interaction.reply({
                content: '❌ This is not a valid ticket channel.',
                ephemeral: true
            });
        }

        // Check if user has staff role or is ticket owner
        const hasStaffRole = interaction.member.roles.cache.has(config.roles.staff);
        const isTicketOwner = ticketData.userId === interaction.user.id;

        if (!hasStaffRole && !isTicketOwner) {
            return interaction.reply({
                content: '❌ Only staff members or the ticket creator can close tickets.',
                ephemeral: true
            });
        }

        // Cancel auto-close timeout if it exists
        if (ticketData.autoCloseTimeout) {
            clearTimeout(ticketData.autoCloseTimeout);
            delete ticketData.autoCloseTimeout;
            console.log(`✅ Cancelled auto-close timeout for ticket #${ticketData.ticketId}`);
        }

        await closeTicket(interaction.channel, ticketData, interaction.user, interaction.guild, false);

        console.log(`✅ Ticket #${ticketData.ticketId} closed by ${interaction.user.tag}`);

    } catch (error) {
        console.error('Error in handleCloseTicket:', error);
        
        if (!interaction.replied) {
            await interaction.reply({
                content: '❌ Error closing ticket. Please try again.',
                ephemeral: true
            });
        }
    }
}
/**
 * Auto-close resolved ticket
 */
async function autoCloseTicket(channel, ticketData, user, guild) {
    await closeTicket(channel, ticketData, user, guild, true);
}

/**
 * Log ticket actions to support channel
 */
async function logTicketAction(action, ticketData, user, guild, isAutoClose = false) {
    try {
        const logChannel = guild.channels.cache.get(config.channels.support);
        if (!logChannel) {
            console.log('No support log channel configured');
            return;
        }

        let color, title, description;
        
        switch (action) {
            case 'created':
                color = 0x00AE86;
                title = '🎫 New Support Ticket';
                description = `**Ticket #${ticketData.ticketId}** has been created`;
                break;
            case 'resolved':
                color = 0x57F287;
                title = '✅ Ticket Resolved';
                description = `**Ticket #${ticketData.ticketId}** has been resolved`;
                break;
            case 'closed':
                color = 0xED4245;
                title = '🔒 Ticket Closed';
                description = `**Ticket #${ticketData.ticketId}** has been ${isAutoClose ? 'automatically ' : ''}closed`;
                break;
        }

        const logEmbed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .addFields(
                { name: '🆔 Ticket ID', value: `#${ticketData.ticketId}`, inline: true },
                { name: '👤 Created By', value: `<@${ticketData.userId}>`, inline: true },
                { name: '🔧 Action By', value: user.tag, inline: true }
            )
            .setFooter({ text: 'Creatok Ticket System', iconURL: guild.iconURL() })
            .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });

    } catch (error) {
        console.error('Error logging ticket action:', error);
    }
}

/**
 * Get active tickets count
 */
function getActiveTicketsCount() {
    return Array.from(activeTickets.values()).filter(ticket => ticket.status === 'open').length;
}

/**
 * Get user's active ticket
 */
function getUserActiveTicket(userId) {
    return Array.from(activeTickets.values()).find(
        ticket => ticket.userId === userId && ticket.status === 'open'
    );
}

/**
 * Debug function to list all active tickets
 */
function debugActiveTickets() {
    console.log('=== ACTIVE TICKETS DEBUG ===');
    console.log(`Total tickets: ${activeTickets.size}`);
    for (const [channelId, ticketData] of activeTickets) {
        console.log(`Channel: ${channelId}, Ticket: #${ticketData.ticketId}, Status: ${ticketData.status}, User: ${ticketData.createdBy}`);
    }
    console.log('=== END DEBUG ===');
}

module.exports = {
    handleTicketInteraction,
    activeTickets,
    createTicket,
    logTicketAction,
    getActiveTicketsCount,
    getUserActiveTicket,
    debugActiveTickets
};