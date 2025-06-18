// File: commands/staff/order-info.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrderById } = require('../../utils/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('order-info')
        .setDescription('Get information about an order')
        .addStringOption(option =>
            option.setName('order_id')
                .setDescription('The order ID to look up')
                .setRequired(true)),
    
    async execute(interaction) {
        try {
            const orderId = interaction.options.getString('order_id').toUpperCase();
            const order = await getOrderById(orderId);
            
            if (!order) {
                return interaction.reply({
                    content: `❌ Order \`${orderId}\` not found`,
                    ephemeral: true
                });
            }

            // Determine status color
            const statusColors = {
                'pending': '#FFA500',
                'processing': '#5865F2',
                'completed': '#00FF00',
                'cancelled': '#FF0000'
            };
            
            const embed = new EmbedBuilder()
                .setColor(statusColors[order.status] || '#5865F2')
                .setTitle(`🛒 Order #${orderId}`)
                .addFields(
                    { name: '👤 Customer', value: `<@${order.userId}>`, inline: true },
                    { name: '🌍 Region', value: order.region, inline: true },
                    { name: '📦 Account Type', value: order.accountType, inline: true },
                    { name: '💰 Price', value: `$${order.price}`, inline: true },
                    { name: '🔄 Status', value: order.status.charAt(0).toUpperCase() + order.status.slice(1), inline: true },
                    { name: '📅 Order Date', value: `<t:${Math.floor(order.createdAt.getTime()/1000)}:F>`, inline: true }
                );

            // Add completion date if completed
            if (order.completedAt) {
                embed.addFields({
                    name: '✅ Completed At',
                    value: `<t:${Math.floor(order.completedAt.getTime()/1000)}:F>`,
                    inline: true
                });
            }

            // Add channel link if exists
            if (order.channelId) {
                embed.addFields({
                    name: '📝 Order Channel',
                    value: `<#${order.channelId}>`,
                    inline: true
                });
            }

            // Add payment method and discount if available
            if (order.paymentMethod) {
                embed.addFields({
                    name: '💳 Payment Method',
                    value: order.paymentMethod,
                    inline: true
                });
            }

            if (order.discountCode) {
                embed.addFields({
                    name: '🎫 Discount Code',
                    value: order.discountCode,
                    inline: true
                });
            }

            embed.setTimestamp();
            
            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error getting order info:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching order information',
                ephemeral: true
            });
        }
    }
};