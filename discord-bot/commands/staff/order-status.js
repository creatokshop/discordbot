// File: commands/staff/order-status.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/config.js');
const { getOrderById, updateOrderStatus } = require('../../utils/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('order-status')
        .setDescription('Update order status (Staff only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option =>
            option.setName('order_id')
                .setDescription('The order ID to update')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('status')
                .setDescription('New status for the order')
                .setRequired(true)
                .addChoices(
                    { name: 'Pending', value: 'pending' },
                    { name: 'Processing', value: 'processing' },
                    { name: 'Completed', value: 'completed' },
                    { name: 'Cancelled', value: 'cancelled' }
                )),
    
    async execute(interaction) {
        try {
            // Check if user has staff role
            if (!interaction.member.roles.cache.has(config.roles.staff)) {
                return interaction.reply({
                    content: '❌ You do not have permission to update order status.',
                    ephemeral: true
                });
            }

            const orderId = interaction.options.getString('order_id').toUpperCase();
            const newStatus = interaction.options.getString('status');
            
            const order = await getOrderById(orderId);
            
            if (!order) {
                return interaction.reply({
                    content: `❌ Order \`${orderId}\` not found`,
                    ephemeral: true
                });
            }

            const oldStatus = order.status;
            
            // Update order status
            await updateOrderStatus(orderId, newStatus);
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`🔄 Order Status Updated`)
                .setDescription(`Order \`${orderId}\` status changed from **${oldStatus}** to **${newStatus}**`)
                .addFields(
                    { name: '👤 Customer', value: `<@${order.userId}>`, inline: true },
                    { name: '📦 Product', value: `${order.accountType} ${order.region}`, inline: true },
                    { name: '👨‍💼 Updated By', value: `${interaction.user.tag}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: false
            });

            console.log(`✅ Order ${orderId} status updated from ${oldStatus} to ${newStatus} by ${interaction.user.tag}`);
            
        } catch (error) {
            console.error('Error updating order status:', error);
            await interaction.reply({
                content: '❌ An error occurred while updating order status',
                ephemeral: true
            });
        }
    }
};