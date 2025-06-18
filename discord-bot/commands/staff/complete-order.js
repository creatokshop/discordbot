// Option 1: Split into separate files (Recommended)

// File: commands/staff/complete-order.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config.js');
const { getOrderById, updateOrderStatus } = require('../../utils/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('complete-order')
        .setDescription('Mark an order as completed (Staff only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('order_id')
                .setDescription('The order ID to complete')
                .setRequired(true)),
    
    async execute(interaction) {
        try {
            // Check if user has staff role
            if (!interaction.member.roles.cache.has(config.roles.staff)) {
                return interaction.reply({
                    content: '❌ You do not have permission to complete orders.',
                    ephemeral: true
                });
            }

            const orderId = interaction.options.getString('order_id').toUpperCase();
            console.log(`Staff ${interaction.user.tag} attempting to complete order: ${orderId}`);
            
            const order = await getOrderById(orderId);
            
            if (!order) {
                return interaction.reply({
                    content: `❌ Order \`${orderId}\` not found`,
                    ephemeral: true
                });
            }

            // Check if order is already completed
            if (order.status === 'completed') {
                return interaction.reply({
                    content: `❌ Order \`${orderId}\` is already marked as completed`,
                    ephemeral: true
                });
            }

            // Check if order is cancelled
            if (order.status === 'cancelled') {
                return interaction.reply({
                    content: `❌ Cannot complete a cancelled order \`${orderId}\``,
                    ephemeral: true
                });
            }
            
            // Update order status to completed
            await updateOrderStatus(orderId, 'completed');
            console.log(`✅ Order ${orderId} marked as completed by ${interaction.user.tag}`);
            
            // Update channel if exists
            if (order.channelId) {
                const channel = interaction.guild.channels.cache.get(order.channelId);
                if (channel) {
                    // Rename channel to indicate completion
                    await channel.setName(`completed-${orderId.toLowerCase()}`);
                    
                    // Hide channel from everyone except staff
                    await channel.permissionOverwrites.edit(interaction.guild.id, {
                        ViewChannel: false
                    });
                    
                    // Keep staff access for record keeping
                    await channel.permissionOverwrites.edit(config.roles.staff, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true
                    });
                    
                    // Send completion message to channel
                    const completionEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(`✅ Order #${orderId} Completed`)
                        .setDescription(`This order has been marked as completed by ${interaction.user.tag}`)
                        .addFields(
                            { name: '👤 Customer', value: `<@${order.userId}>`, inline: true },
                            { name: '📦 Product', value: `${order.accountType} ${order.region}`, inline: true },
                            { name: '💰 Price', value: `$${order.price}`, inline: true },
                            { name: '✅ Completed By', value: `${interaction.user.tag}`, inline: true },
                            { name: '📅 Completed At', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
                        )
                        .setFooter({ text: 'Order Management System' })
                        .setTimestamp();
                    
                    await channel.send({ embeds: [completionEmbed] });
                    console.log(`✅ Completion message sent to channel ${channel.name}`);
                }
            }
            
            // Send DM to customer
            try {
                const user = await interaction.client.users.fetch(order.userId);
                const dmEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`✅ Your Order #${orderId} is Complete!`)
                    .setDescription(
                        `Great news! Your ${order.accountType} ${order.region} account is ready!\n\n` +
                        `**What's next?**\n` +
                        `1. Check your DMs for account details\n` +
                        `2. Login and verify your account\n` +
                        `3. Contact support if you need any help\n\n` +
                        `**Order Details:**\n` +
                        `• **Product:** ${order.accountType} ${order.region}\n` +
                        `• **Price:** $${order.price}\n` +
                        `• **Order ID:** \`${orderId}\`\n\n` +
                        `Thank you for choosing Creatok! 🎉`
                    )
                    .setFooter({ text: 'Creatok - Premium TikTok Shop Accounts' })
                    .setTimestamp();
                
                await user.send({ embeds: [dmEmbed] });
                console.log(`✅ Completion DM sent to customer ${user.tag}`);
            } catch (dmError) {
                console.error('Could not send completion DM:', dmError);
            }
            
            // Reply to staff member
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Order Completed Successfully')
                        .setDescription(`Order \`${orderId}\` has been marked as completed`)
                        .addFields(
                            { name: '👤 Customer', value: `<@${order.userId}>`, inline: true },
                            { name: '📦 Product', value: `${order.accountType} ${order.region}`, inline: true },
                            { name: '💰 Price', value: `$${order.price}`, inline: true }
                        )
                        .setFooter({ text: 'Customer has been notified via DM' })
                        .setTimestamp()
                ],
                ephemeral: false
            });
            
        } catch (error) {
            console.error('Error completing order:', error);
            await interaction.reply({
                content: '❌ An error occurred while completing the order. Please try again or contact a developer.',
                ephemeral: true
            });
        }
    }
};