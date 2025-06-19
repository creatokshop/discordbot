const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('../config/config.js');
const { trackInteraction, recordPurchase, validateDiscountCode, applyDiscountCode, getOrCreateUser } = require('../utils/database.js');
const { createOrderChannel } = require('./orderHandlers');

/**
 * Enhanced account purchase handler with improved modal
 */
async function handleAccountPurchase(interaction, region, accountType, price) {
    try {
        console.log(`Account purchase initiated: ${region} ${accountType} for ${interaction.user.tag}`);
        
        // Track interaction
        await trackInteraction(interaction.user.id, 'account_purchase_start');
        
        // Create order modal with improved styling
        const modal = new ModalBuilder()
            .setCustomId(`order_${region.toLowerCase()}_${accountType.toLowerCase().replace(/\s+/g, '_')}_${price}`)
            .setTitle(`Order ${accountType} ${region} Account!`);

        // Payment method selection with better formatting
        const paymentMethodInput = new TextInputBuilder()
            .setCustomId('payment_method')
            .setLabel('Which Payment Method do you Prefer?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Zelle(10% off) • Crypto • PayPal • Wise')
            .setRequired(true)
            .setMaxLength(100);

        // Discord username for contact (auto-filled)
        const discordInput = new TextInputBuilder()
            .setCustomId('discord_username')
            .setLabel('Discord Username (for contact)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('YourUsername#1234')
            .setValue(interaction.user.tag)
            .setRequired(true)
            .setMaxLength(100);

        // Discount code (optional) - Enhanced with better description
        const discountInput = new TextInputBuilder()
            .setCustomId('discount_code')
            .setLabel('Discount Code (Optional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter discount code for additional savings')
            .setRequired(false)
            .setMaxLength(50);

        // Additional notes
        const notesInput = new TextInputBuilder()
            .setCustomId('additional_notes')
            .setLabel('Additional Notes (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Any special requests or questions?')
            .setRequired(false)
            .setMaxLength(500);

        // Add inputs to action rows
        const firstActionRow = new ActionRowBuilder().addComponents(paymentMethodInput);
        const secondActionRow = new ActionRowBuilder().addComponents(discordInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(discountInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(notesInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);

        await interaction.showModal(modal);
        console.log(`✅ Order modal shown to ${interaction.user.tag} for ${region} ${accountType}`);

    } catch (error) {
        console.error(`Error in handleAccountPurchase for ${region} ${accountType}:`, error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Failed to open order form. Please try again later.',
                flags: 64 // MessageFlags.Ephemeral
            });
        }
    }
}

/**
 * Enhanced modal submission handler with proper interaction handling
 */
async function handleModalSubmit(interaction) {
    try {
        const { customId } = interaction;
        console.log(`Modal submission received: ${customId} from ${interaction.user.tag}`);

        // CRITICAL: Defer the reply immediately to prevent timeout
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ ephemeral: true });
            console.log(`✅ Modal interaction deferred for ${interaction.user.tag}`);
        }

        // Parse order details from customId
        if (customId.startsWith('order_')) {
            const parts = customId.split('_');
            const region = parts[1].toUpperCase();
            const accountType = parts.slice(2, -1).join(' ').replace(/_/g, ' ');
            const originalPrice = parseInt(parts[parts.length - 1]);

            // Get form data
            const paymentMethod = interaction.fields.getTextInputValue('payment_method');
            const discordUsername = interaction.fields.getTextInputValue('discord_username');
            const discountCode = interaction.fields.getTextInputValue('discount_code')?.trim() || '';
            const additionalNotes = interaction.fields.getTextInputValue('additional_notes') || 'None';

            // Generate unique order ID
            const orderID = `${Date.now()}`;

            // Initialize pricing variables
            let finalPrice = originalPrice;
            let discountApplied = false;
            let discountInfo = {
                code: 'None',
                type: 'none',
                value: 0,
                amount: 0
            };

            // Process all async operations
            try {
                // FIXED: Ensure user exists in database before recording purchase
                console.log(`👤 Ensuring user exists in database: ${interaction.user.tag}`);
                await getOrCreateUser({
                    id: interaction.user.id,
                    tag: interaction.user.tag,
                    joinedAt: new Date()
                });
                console.log(`✅ User ensured in database: ${interaction.user.tag}`);

                // Track the order submission
                await trackInteraction(interaction.user.id, 'order_submitted');

                // Process discount code if provided
                if (discountCode) {
                    try {
                        console.log(`🎫 Processing discount code: ${discountCode} for order ${orderID}`);
                        
                        const orderData = {
                            region: region,
                            accountType: accountType,
                            price: originalPrice
                        };

                        const validation = await validateDiscountCode(discountCode, interaction.user.id, orderData);
                        
                        if (validation.valid) {
                            finalPrice = validation.finalPrice;
                            discountApplied = true;
                            discountInfo = {
                                code: discountCode.toUpperCase(),
                                type: validation.discount.type,
                                value: validation.discount.value,
                                amount: validation.discountAmount
                            };

                            console.log(`✅ Discount applied: ${discountCode} - $${validation.discountAmount} off (${originalPrice} -> ${finalPrice})`);
                        } else {
                            console.log(`❌ Discount validation failed: ${validation.error}`);
                        }
                    } catch (discountError) {
                        console.error(`Error processing discount code ${discountCode}:`, discountError.message);
                    }
                }

                // Create complete order data object
                const orderData = {
                    orderID: orderID,
                    userTag: interaction.user.tag,
                    region: region,
                    accountType: accountType,
                    originalPrice: originalPrice,
                    price: finalPrice,
                    discountApplied: discountApplied,
                    discountCode: discountInfo.code,
                    discountType: discountInfo.type,
                    discountValue: discountInfo.value,
                    discountAmount: discountInfo.amount,
                    paymentMethod: paymentMethod,
                    additionalNotes: additionalNotes,
                    timestamp: new Date()
                };

                // Save the complete order to database
                console.log(`💾 Saving order to database: ${orderID}`);
                const savedOrder = await recordPurchase(interaction.user.id, orderData);
                
                if (!savedOrder) {
                    console.error(`❌ Failed to save order ${orderID} to database`);
                    throw new Error('Failed to save order to database');
                }

                console.log(`✅ Order successfully saved to database with ID: ${orderID}`);

                // Apply discount code usage if discount was applied
                if (discountApplied && discountCode) {
                    try {
                        await applyDiscountCode(
                            discountCode, 
                            interaction.user.id, 
                            interaction.user.tag, 
                            orderID, 
                            discountInfo.amount
                        );
                        console.log(`✅ Discount code usage recorded: ${discountCode}`);
                    } catch (applyError) {
                        console.error(`Error recording discount usage:`, applyError);
                        // Don't fail the order, just log the error
                    }
                }
                
                // Create order channel (non-blocking)
                let orderChannel;
                try {
                    orderChannel = await createOrderChannel(interaction, orderData);
                    console.log(`✅ Created order channel: ${orderChannel.name}`);
                    orderData.channelId = orderChannel.id;
                } catch (channelError) {
                    console.error('Failed to create order channel:', channelError);
                    // Continue even if channel creation fails
                }

                // Create enhanced order embed for staff with discount info
                const orderEmbed = new EmbedBuilder()
                    .setColor(discountApplied ? '#FFD700' : '#00FF00') // Gold if discount applied
                    .setTitle('🛒 New Account Order')
                    .setDescription(`**New order submitted by ${interaction.user.tag}**\n\n⚠️ **This form has been submitted to Creatok Team**\n**Do not share passwords or other sensitive information.**`)
                    .addFields(
                        { name: '👤 Customer', value: `<@${interaction.user.id}> (${discordUsername})`, inline: true },
                        { name: '🌍 Region', value: region, inline: true },
                        { name: '📦 Account Type', value: accountType, inline: true },
                        { name: '💰 Original Price', value: `$${originalPrice}`, inline: true },
                        { name: '💳 Payment Method', value: paymentMethod, inline: true },
                        { name: '📝 Order Channel', value: orderChannel ? orderChannel.toString() : 'Not created', inline: true }
                    );

                // Add discount information to embed
                if (discountApplied) {
                    orderEmbed.addFields(
                        { name: '🎫 Discount Code', value: discountInfo.code, inline: true },
                        { name: '💸 Discount Amount', value: `$${discountInfo.amount}`, inline: true },
                        { name: '💵 Final Price', value: `$${finalPrice}`, inline: true }
                    );
                } else {
                    orderEmbed.addFields(
                        { name: '🎫 Discount Code', value: discountCode || 'None', inline: true },
                        { name: '💵 Final Price', value: `$${finalPrice}`, inline: true }
                    );
                }

                orderEmbed.addFields(
                    { name: '📝 Additional Notes', value: additionalNotes || 'None' }
                )
                .setFooter({ text: `Order ID: ${orderID} | Status: PENDING${discountApplied ? ' | DISCOUNT APPLIED' : ''}` })
                .setTimestamp();

                // Send order to staff channel (non-blocking)
                const staffChannelId = config.channels.orders || config.channels.support;
                const staffChannel = interaction.guild?.channels.cache.get(staffChannelId);
                
                if (staffChannel) {
                    // Use setTimeout to make this non-blocking
                    setTimeout(async () => {
                        try {
                            await staffChannel.send({
                                content: `🔔 **New Order Alert** - ${interaction.user.tag} | Order ID: \`${orderID}\`${discountApplied ? ' | 🎫 **DISCOUNT APPLIED**' : ''}`,
                                embeds: [orderEmbed]
                            });
                            console.log(`✅ Order notification sent to staff channel for order ${orderID}`);
                        } catch (staffError) {
                            console.error(`Failed to send staff notification for order ${orderID}:`, staffError);
                        }
                    }, 100);
                } else {
                    console.error(`❌ Could not find staff channel with ID: ${staffChannelId}`);
                }

                // Enhanced confirmation embed for user with discount info
                const confirmEmbed = new EmbedBuilder()
                    .setColor(discountApplied ? '#FFD700' : '#5865F2')
                    .setTitle('✅ Order Submitted Successfully!')
                    .setDescription(
                        `**Thank you for your order!**\n\n` +
                        `**Order Details:**\n` +
                        `• **Account:** ${accountType} ${region}\n` +
                        `• **Original Price:** $${originalPrice}\n` +
                        (discountApplied ? 
                            `• **Discount Code:** ${discountInfo.code}\n` +
                            `• **Discount Amount:** -$${discountInfo.amount}\n` +
                            `• **Final Price:** $${finalPrice} 🎉\n` : 
                            `• **Final Price:** $${finalPrice}\n`) +
                        `• **Payment:** ${paymentMethod}\n` +
                        `• **Order ID:** \`${orderID}\`\n\n` +
                        `**What happens next?**\n` +
                        `1️⃣ Our team will review your order within 30 minutes\n` +
                        `2️⃣ You'll receive payment instructions via DM or ticket\n` +
                        `3️⃣ Account delivery within 24 hours after payment confirmation\n` +
                        `4️⃣ Full support and warranty included\n\n` +
                        `**Need help?** Create a support ticket or DM our staff!\n\n` +
                        `*Keep your Order ID for reference: \`${orderID}\`*`
                    )
                    .setFooter({ text: `Creatok - Premium TikTok Shop Accounts | Order Saved ✅${discountApplied ? ' | Discount Applied 🎫' : ''}` })
                    .setTimestamp();

                // Add savings highlight if discount applied
                if (discountApplied) {
                    confirmEmbed.addFields(
                        { name: '🎉 You Saved!', value: `**$${discountInfo.amount}** with code **${discountInfo.code}**`, inline: false }
                    );
                }

                // Add channel info if created
                if (orderChannel) {
                    confirmEmbed.addFields(
                        { name: '📝 Order Channel', value: `A private channel has been created: ${orderChannel}` }
                    );
                } else {
                    confirmEmbed.addFields(
                        { name: '⚠️ Note', value: 'Could not create private order channel. Staff will contact you directly.' }
                    );
                }

                // Send the final response using editReply since we deferred
                await interaction.editReply({
                    embeds: [confirmEmbed]
                });

                console.log(`✅ Order processed successfully for ${interaction.user.tag}: ${region} ${accountType} (Order ID: ${orderID})`);
                console.log(`📊 Order Summary - ID: ${orderID}, User: ${interaction.user.tag}, Product: ${accountType} ${region}, Original: $${originalPrice}, Final: $${finalPrice}, Discount: ${discountApplied ? discountInfo.code : 'None'}, Payment: ${paymentMethod}`);

            } catch (processingError) {
                console.error('Error during order processing:', processingError);
                
                // Send error response
                await interaction.editReply({
                    content: '❌ An error occurred while processing your order. Please try again or contact support.\n\n**Error Details:** Database or processing error. Please contact an administrator if this persists.'
                });
            }
        }

    } catch (error) {
        console.error('Error handling modal submission:', error);
        
        // Handle different error scenarios
        if (error.code === 10062) {
            console.log('Interaction has expired (10062 error) - cannot respond');
            return;
        }
        
        try {
            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ An error occurred while processing your order. Please try again or contact support.'
                });
            } else if (!interaction.replied) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your order. Please try again or contact support.',
                    flags: 64 // MessageFlags.Ephemeral
                });
            }
        } catch (replyError) {
            console.error('Failed to send error response:', replyError);
        }
    }
}
    
module.exports = {
    handleAccountPurchase,
    handleModalSubmit
};