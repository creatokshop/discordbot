const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config.js');
const { Order, updateOrderStatus, getOrderById } = require('../utils/database.js');

async function createOrderChannel(interaction, orderData) {
    try {
        const guild = interaction.guild;
        const category = guild.channels.cache.get(config.channels.orderCategory);
        
        if (!category) {
            throw new Error('Order category not found');
        }

        // Create private channel
        const channel = await guild.channels.create({
            name: `order-${orderData.orderID.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ['ViewChannel']
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                },
                {
                    id: config.roles.staff,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
                }
            ]
        });

        // Create order embed
        const orderEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🛒 Order #${orderData.orderID}`)
            .setDescription(`**Order Details for ${orderData.userTag}**`)
            .addFields(
                { name: '👤 Customer', value: `<@${interaction.user.id}>`, inline: true },
                { name: '🌍 Region', value: orderData.region, inline: true },
                { name: '📦 Account Type', value: orderData.accountType, inline: true },
                { name: '💰 Price', value: `$${orderData.price}`, inline: true },
                { name: '💳 Payment Method', value: orderData.paymentMethod, inline: true },
                { name: '🎫 Discount Code', value: orderData.discountCode || 'None', inline: true },
                { name: '📝 Additional Notes', value: orderData.additionalNotes || 'None' },
                { name: '📅 Order Date', value: `<t:${Math.floor(orderData.timestamp.getTime()/1000)}:F>`, inline: true },
                { name: '🔄 Status', value: 'Pending', inline: true }
            )
            .setFooter({ text: 'Creatok Order Management' })
            .setTimestamp();

        // Only include cancel button now
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`cancel_order_${orderData.orderID}`)
                    .setLabel('Cancel Order')
                    .setStyle(ButtonStyle.Danger)
            );

        // Send initial message
        await channel.send({
            content: `📦 New Order - <@${interaction.user.id}> | <@&${config.roles.staff}>`,
            embeds: [orderEmbed],
            components: [actionRow]
        });

        // Update database with channel ID
        await updateOrderStatus(orderData.orderID, 'processing', channel.id);

        return channel;
    } catch (error) {
        console.error('Error creating order channel:', error);
        throw error;
    }
}

async function handleOrderCancellation(interaction, orderId) {
    try {
        const order = await getOrderById(orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Update order status
        await updateOrderStatus(orderId, 'cancelled');

        // Update channel if exists
        const channel = interaction.guild?.channels.cache.get(order.channelId);
        if (channel) {
            await channel.setName(`cancelled-${orderId.toLowerCase()}`);
            await channel.permissionOverwrites.edit(interaction.guild.id, {
                ViewChannel: false
            });
            
            const cancellationEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`❌ Order #${orderId} Cancelled`)
                .setDescription(`This order has been cancelled by ${interaction.user.tag}`)
                .setTimestamp();
            
            await channel.send({ embeds: [cancellationEmbed] });
        }

        // Create cancellation embed
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`❌ Order #${orderId} Cancelled`)
            .setDescription(`This order has been cancelled by ${interaction.user.tag}`)
            .addFields(
                { name: '👤 Customer', value: `<@${order.userId}>`, inline: true },
                { name: '📦 Product', value: order.accountType, inline: true },
                { name: '💰 Price', value: `$${order.price}`, inline: true },
                { name: '📅 Cancelled At', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true }
            )
            .setFooter({ text: 'Creatok Order Management' })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: false
        });

        // Notify customer
        try {
            const user = await interaction.client.users.fetch(order.userId);
            const dmEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`❌ Your Order #${orderId} Has Been Cancelled`)
                .setDescription(
                    `Your ${order.accountType} ${order.region} account order has been cancelled.\n\n` +
                    `If this was a mistake, please contact support immediately.\n\n` +
                    `**Order ID:** \`${orderId}\`\n` +
                    `**Cancelled At:** <t:${Math.floor(Date.now()/1000)}:F>`
                )
                .setFooter({ text: 'Creatok - Premium TikTok Shop Accounts' })
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            console.error('Could not send cancellation DM:', dmError);
        }

    } catch (error) {
        console.error('Error cancelling order:', error);
        await interaction.reply({
            content: '❌ An error occurred while cancelling the order. Please try again or contact support.',
            ephemeral: true
        });
    }
}

module.exports = {
    createOrderChannel,
    handleOrderCancellation
};