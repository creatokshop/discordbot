const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config/config.js');
const { updateUserRegion, trackInteraction } = require('../utils/database.js');
const { handleAccountPurchase, handleModalSubmit } = require('../handlers/purchaseHandlers.js');
const { handleOrderCancellation } = require('../handlers/orderHandlers.js');
// Import the ticket handler
const { handleTicketInteraction, createTicket } = require('../handlers/ticketHandlers.js');
const { loadProducts } = require('../commands/admin/update-price.js');
module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(client, interaction) {
        try {
            // Check if interaction is valid and not expired
            if (!interaction || !interaction.isRepliable()) {
                console.log('Interaction is not repliable or has expired');
                return;
            }

            // Handle button interactions
            if (interaction.isButton()) {
                const { customId, member, guild } = interaction;
                
                console.log(`Button interaction received: ${customId} from user: ${interaction.user.tag}`);

                // Handle ticket creation buttons first
                if (customId.startsWith('create_ticket_')) {
                    const ticketType = customId.replace('create_ticket_', '');
                    await handleTicketCreation(interaction, ticketType);
                    return;
                }

                // Handle existing ticket interactions
                const ticketHandled = await handleTicketInteraction(interaction);
                if (ticketHandled) return;

                // Handle dynamic order buttons (only cancellation now)
                if (customId.startsWith('cancel_order_')) {
                    const orderId = customId.replace('cancel_order_', '');
                    await handleOrderCancellation(interaction, orderId);
                    return;
                }

                // Handle dynamic product purchase buttons (for backward compatibility with static buttons)
                if (customId.startsWith('buy_')) {
                    const productId = customId.replace('buy_', '');
                    await handleDynamicProductPurchase(interaction, productId);
                    return;
                }

                // Handle static buttons
                switch (customId) {
                    // Region interest selection
                    case 'region_us':
                        await handleRegionInterest(interaction, 'US');
                        break;
                    case 'region_uk':
                        await handleRegionInterest(interaction, 'UK');
                        break;
                    case 'region_eu':
                        await handleRegionInterest(interaction, 'EU');
                        break;
                    
                    // Channel selection
                    case 'channel_us_general':
                        await handleChannelSelection(interaction, 'US', 'general');
                        break;
                    case 'channel_us_region':
                        await handleChannelSelection(interaction, 'US', 'region');
                        break;
                    case 'channel_uk_general':
                        await handleChannelSelection(interaction, 'UK', 'general');
                        break;
                    case 'channel_uk_region':
                        await handleChannelSelection(interaction, 'UK', 'region');
                        break;
                    case 'channel_eu_general':
                        await handleChannelSelection(interaction, 'EU', 'general');
                        break;
                    case 'channel_eu_region':
                        await handleChannelSelection(interaction, 'EU', 'region');
                        break;

                        //handle two buttons  
                    case 'getting_started':
                        await handleGettingStarted(interaction);
                        break;
                    case 'server_walkthrough':
                        await handleServerWalkthrough(interaction);
                        break;
                    // Show account options
                    case 'show_account_options':
                        await handleShowAccountOptionsModal(interaction);
                        break;

case 'final_close_ticket':
    // Defer immediately
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const { activeTickets } = require('../handlers/ticketHandlers.js');
        
        const channel = interaction.channel;
        const ticketData = activeTickets.get(channel.id);
        
        if (!ticketData) {
            return interaction.editReply({
                content: '❌ Ticket data not found.'
            });
        }

        // Check if user has staff role
        if (!interaction.member.roles.cache.has(config.roles.staff)) {
            return interaction.editReply({
                content: '❌ Only staff members can close tickets.'
            });
        }

        // Update the deferred reply first
        await interaction.editReply({ 
            content: '🔒 Ticket is being closed...' 
        });

        // Create closure embed
        const { EmbedBuilder } = require('discord.js');
        const closureEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(`This ticket has been closed by ${interaction.user.tag}.`)
            .setColor(0xED4245)
            .addFields(
                { name: '📋 Summary', value: `**Ticket #${ticketData.ticketNumber || ticketData.ticketId}** is now closed and will be deleted shortly.`, inline: false }
            )
            .setFooter({ text: 'This channel will be deleted in 10 seconds.' });

        // Send closure message to channel
        await channel.send({ embeds: [closureEmbed] });

        // Log the ticket closure (if you have logging)
        console.log(`Ticket ${ticketData.ticketNumber || ticketData.ticketId} closed by ${interaction.user.tag}`);

        // Remove from active tickets
        activeTickets.delete(channel.id);

        // Delete channel after delay
        setTimeout(async () => {
            try {
                await channel.delete();
                console.log(`Ticket channel ${channel.name} deleted successfully`);
            } catch (error) {
                console.error('Error deleting ticket channel:', error);
            }
        }, 10000);

    } catch (error) {
        console.error('Error closing ticket:', error);
        
        try {
            await interaction.editReply({
                content: '❌ Failed to close ticket. Please try again.'
            });
        } catch (editError) {
            console.error('Failed to edit reply:', editError);
        }
    }
    break;
                    default:
                        console.log(`Unknown button interaction: ${customId}`);
                        await safeReply(interaction, {
                            content: '❌ This button interaction is not recognized.',
                            ephemeral: true
                        });
                }
            }
            
            // Handle string select menu interactions
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'account_selection') {
                    await handleAccountSelectionFromModal(interaction);
                }
            }
            
            // Handle modal submissions with improved error handling
            if (interaction.isModalSubmit()) {
                console.log(`Modal submission received: ${interaction.customId} from user: ${interaction.user.tag}`);
                
                // Check if interaction is still valid before processing
                if (!interaction.isRepliable()) {
                    console.log('Modal interaction has expired or is not repliable');
                    return;
                }

                await handleModalSubmit(interaction);
            }

        } catch (error) {
            console.error('Error handling interaction:', error);
            
            // Only try to respond if the interaction hasn't been handled yet
            await safeReply(interaction, {
                content: '❌ An error occurred while processing your request. Please try again later.',
                ephemeral: true
            });
        }
    }
};

/**
 * Safely reply to an interaction, checking if it's already been replied to
 */
async function safeReply(interaction, options) {
    try {
        if (!interaction.isRepliable()) {
            console.log('Interaction is not repliable - likely expired');
            return;
        }

        if (interaction.replied) {
            console.log('Interaction already replied to, using followUp');
            return await interaction.followUp(options);
        } else if (interaction.deferred) {
            console.log('Interaction deferred, using editReply');
            return await interaction.editReply(options);
        } else {
            console.log('Using initial reply');
            return await interaction.reply(options);
        }
    } catch (error) {
        console.error('Error in safeReply:', error);
        // If we can't reply, at least log it - don't throw
    }
}

/**
 * Handle ticket creation from setup panel buttons
 */
async function handleTicketCreation(interaction, ticketType) {
    try {
        console.log(`Ticket creation requested: ${ticketType} by ${interaction.user.tag}`);
        
        // Check if interaction is still valid
        if (!interaction.isRepliable()) {
            console.log('Ticket creation interaction has expired');
            return;
        }

        // Defer the reply immediately
        await interaction.deferReply({ ephemeral: true });
        
        // Check if user already has an active ticket
        const { activeTickets } = require('../handlers/ticketHandlers.js');
        const existingTicket = Array.from(activeTickets.values()).find(ticket => ticket.userId === interaction.user.id);
        
        if (existingTicket) {
            return interaction.editReply({
                content: `❌ You already have an active ticket: <#${existingTicket.channelId}>`
            });
        }

        // Map ticket types to readable names
        const typeMapping = {
            'general': '🆘 General Support',
            'purchase': '🛒 Purchase Support', 
            'technical': '🔧 Technical Support'
        };

        const ticketTypeName = typeMapping[ticketType] || '🆘 General Support';

        // Create the ticket using your existing createTicket function
        const { createTicket } = require('../handlers/ticketHandlers.js');
        if (typeof createTicket === 'function') {
            await createTicket(interaction, ticketType, ticketTypeName);
        } else {
            // Fallback if createTicket function doesn't exist
            await createTicketFallback(interaction, ticketType, ticketTypeName);
        }

        console.log(`✅ Ticket created successfully for ${interaction.user.tag} - Type: ${ticketType}`);

    } catch (error) {
        console.error('Error creating ticket:', error);
        
        // Use safe reply for error handling
        await safeReply(interaction, {
            content: '❌ An error occurred while creating your ticket. Please try again later.'
        });
    }
}

/**
 * Fallback ticket creation function
 */
async function createTicketFallback(interaction, ticketType, ticketTypeName) {
    try {
        const guild = interaction.guild;
        const { activeTickets } = require('../handlers/ticketHandlers.js');
        
        // Generate ticket ID
        const ticketId = Date.now().toString().slice(-6);
        
        // Get ticket category
        const category = guild.channels.cache.get(config.channels.ticketCategory);
        if (!category) {
            throw new Error('Ticket category not found in config');
        }

        // Create ticket channel
        const ticketChannel = await guild.channels.create({
            name: `ticket-${ticketId}`,
            type: 0, // Text channel
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
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages']
                }
            ]
        });

        // Create ticket data
        const ticketData = {
            ticketId: ticketId,
            channelId: ticketChannel.id,
            userId: interaction.user.id,
            userTag: interaction.user.tag,
            type: ticketType,
            status: 'open',
            createdAt: new Date()
        };

        // Store in activeTickets Map
        activeTickets.set(ticketChannel.id, ticketData);

        // Create ticket embed
        const embed = new EmbedBuilder()
            .setTitle(`🎫 ${ticketTypeName}`)
            .setDescription(
                `Hello ${interaction.user}! Thank you for creating a support ticket.\n\n` +
                `**Ticket Information:**\n` +
                `• **Ticket ID:** #${ticketId}\n` +
                `• **Type:** ${ticketTypeName}\n` +
                `• **Created:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                `Please describe your issue in detail. Our support team will be with you shortly!`
            )
            .setColor(0x00AE86)
            .setFooter({ text: 'Creatok Support System' })
            .setTimestamp();

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('final_close_ticket')
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

        // Send ticket message
        await ticketChannel.send({
            content: `${interaction.user} | <@&${config.roles.staff}>`,
            embeds: [embed],
            components: [closeButton]
        });

        // Reply to user (since interaction was deferred)
        await interaction.editReply({
            content: `✅ Ticket created! Please check ${ticketChannel}`
        });

        console.log(`✅ Fallback ticket created: #${ticketId} for ${interaction.user.tag}`);

    } catch (error) {
        console.error('Error in createTicketFallback:', error);
        throw error;
    }
}

/**
 * Updated handleAccountSelectionFromModal function to work with dynamic products
 */
async function handleAccountSelectionFromModal(interaction) {
    try {
        const selectedValue = interaction.values[0];
        console.log(`Account selected from modal: ${selectedValue} by ${interaction.user.tag}`);
        
        if (!interaction.isRepliable()) {
            console.log('Account selection interaction has expired');
            return;
        }

        // Load current products to get the details
        const products = await loadProducts();
        const selectedProduct = products.find(p => p.id === selectedValue);

        if (!selectedProduct) {
            console.log(`Product not found: ${selectedValue}`);
            await safeReply(interaction, {
                content: '❌ Selected product not found. Please try again.',
                ephemeral: true
            });
            return;
        }

        // Track the selection
        await trackInteraction(interaction.user.id, 'product_selected', {
            productId: selectedProduct.id,
            productLabel: selectedProduct.label,
            price: selectedProduct.price
        });

        // Use the product data for the purchase
        await handleAccountPurchase(
            interaction, 
            selectedProduct.region, 
            selectedProduct.type, 
            selectedProduct.price,
            selectedProduct.label // Pass the full label for better display
        );

    } catch (error) {
        console.error('Error in handleAccountSelectionFromModal:', error);
        
        await safeReply(interaction, {
            content: '❌ Failed to process account selection. Please try again later.',
            ephemeral: true
        });
    }
}

/**
 * Updated handleShowAccountOptionsModal function to work with dynamic products
 */
async function handleShowAccountOptionsModal(interaction) {
    try {
        console.log(`Account options modal requested by: ${interaction.user.tag}`);
        
        if (!interaction.isRepliable()) {
            console.log('Account options interaction has expired');
            return;
        }

        await trackInteraction(interaction.user.id, 'view_account_options');
        
        // Load current products
        const products = await loadProducts();
        
        if (products.length === 0) {
            await safeReply(interaction, {
                content: '❌ No products are currently available. Please contact an administrator.',
                ephemeral: true
            });
            return;
        }

        // Create options from loaded products
        const accountOptions = products.map(product => ({
            label: product.label,
            description: `${product.description} - $${product.price}`,
            value: product.id,
            emoji: product.featured ? '⭐' : undefined
        }));

        // Limit to 25 options (Discord's limit)
        const limitedOptions = accountOptions.slice(0, 25);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('account_selection')
            .setPlaceholder('Choose an option')
            .addOptions(limitedOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Calculate some stats for the embed
        const totalProducts = products.length;
        const featuredCount = products.filter(p => p.featured).length;
        const minPrice = Math.min(...products.map(p => p.price));
        const maxPrice = Math.max(...products.map(p => p.price));

        // Group products by region for additional info
        const regionCounts = {};
        products.forEach(product => {
            regionCounts[product.region] = (regionCounts[product.region] || 0) + 1;
        });

        const regionInfo = Object.entries(regionCounts)
            .map(([region, count]) => `${getRegionEmoji(region)} ${region}: ${count}`)
            .join(' • ');

        const embed = new EmbedBuilder()
            .setColor('#9146FF')
            .setTitle('🛒 Choose Your Account Type')
            .setDescription(
                `Select the account type you'd like to purchase from the dropdown below:\n\n` +
                `📦 **${totalProducts}** products available\n` +
                `⭐ **${featuredCount}** featured products\n` +
                `💰 Price range: **$${minPrice} - $${maxPrice}**\n\n` +
                `**Available by Region:**\n${regionInfo}`
            )
            .setFooter({ text: 'Select your preferred account type to continue' })
            .setTimestamp();

        await safeReply(interaction, {
            embeds: [embed],
            components: [row],
            ephemeral: true
        });

        console.log(`✅ Account selection modal displayed to ${interaction.user.tag} with ${totalProducts} products`);

    } catch (error) {
        console.error('Error in handleShowAccountOptionsModal:', error);
        
        await safeReply(interaction, {
            content: '❌ Failed to load account options. Please try again later.',
            ephemeral: true
        });
    }
}

/**
 * Dynamic button handler for direct product purchases
 */
async function handleDynamicProductPurchase(interaction, productId) {
    try {
        console.log(`Direct product purchase: ${productId} by ${interaction.user.tag}`);
        
        if (!interaction.isRepliable()) {
            console.log('Product purchase interaction has expired');
            return;
        }

        // Load current products to get the details
        const products = await loadProducts();
        const selectedProduct = products.find(p => p.id === productId);

        if (!selectedProduct) {
            console.log(`Product not found for direct purchase: ${productId}`);
            await safeReply(interaction, {
                content: '❌ This product is no longer available. Please check the latest options.',
                ephemeral: true
            });
            return;
        }

        // Track the direct purchase attempt
        await trackInteraction(interaction.user.id, 'direct_product_purchase', {
            productId: selectedProduct.id,
            productLabel: selectedProduct.label,
            price: selectedProduct.price
        });

        // Use the product data for the purchase
        await handleAccountPurchase(
            interaction, 
            selectedProduct.region, 
            selectedProduct.type, 
            selectedProduct.price,
            selectedProduct.label
        );

    } catch (error) {
        console.error('Error in handleDynamicProductPurchase:', error);
        
        await safeReply(interaction, {
            content: '❌ Failed to process product purchase. Please try again later.',
            ephemeral: true
        });
    }
}

/**
 * Helper function to get region emoji
 */
function getRegionEmoji(region) {
    const regionEmojis = {
        'US': '🇺🇸',
        'UK': '🇬🇧', 
        'EU': '🇪🇺',
        'Non-TTS': '🔗'
    };
    return regionEmojis[region] || '🌍';
}

/**
 * Handle initial region interest selection
 */
async function handleRegionInterest(interaction, regionName) {
    try {
        console.log(`Handling region interest: ${regionName} for user: ${interaction.user.tag}`);
        
        if (!interaction.isRepliable()) {
            console.log('Region interest interaction has expired');
            return;
        }

        await trackInteraction(interaction.user.id, 'region_interest');
        
        try {
            await updateUserRegion(interaction.user.id, regionName.toLowerCase(), 'general');
            console.log(`✅ Updated database region for ${interaction.user.tag} to ${regionName.toLowerCase()}`);
        } catch (dbError) {
            console.error(`❌ Failed to update database for ${interaction.user.tag}:`, dbError);
        }
        
        const regionEmoji = {
            'US': '🇺🇸',
            'UK': '🇬🇧',
            'EU': '🇪🇺'
        };

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`${regionEmoji[regionName]} ${regionName} Region Selected`)
            .setDescription(
                `**Great choice!** You've selected interest in **${regionName}** accounts.\n\n` +
                `**Now choose where you'd like to start:**\n\n` +
                `🌍 **General Channel** - Join the main community discussion\n` +
                `${regionEmoji[regionName]} **${regionName} Channel** - Access region-specific content and offers\n\n` +
                `*You can always switch channels later!*`
            )
            .setFooter({ 
                text: `Step 2 of 2 - Choose your preferred channel`,
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTimestamp();

        const channelRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`channel_${regionName.toLowerCase()}_general`)
                    .setLabel('🌍 General Channel')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`channel_${regionName.toLowerCase()}_region`)
                    .setLabel(`${regionEmoji[regionName]} ${regionName} Channel`)
                    .setStyle(ButtonStyle.Success)
            );

        await safeReply(interaction, {
            embeds: [embed],
            components: [channelRow],
            ephemeral: true
        });

        console.log(`✅ Region interest selection sent to ${interaction.user.tag} for ${regionName}`);

    } catch (error) {
        console.error(`Error in handleRegionInterest for ${regionName}:`, error);
        
        await safeReply(interaction, {
            content: '❌ Failed to process region selection. Please try again later.',
            ephemeral: true
        });
    }
}

/**
 * Handle channel selection and role assignment
 */
async function handleChannelSelection(interaction, regionName, channelType) {
    try {
        console.log(`Handling channel selection: ${regionName} ${channelType} for user: ${interaction.user.tag}`);
        
        if (!interaction.isRepliable()) {
            console.log('Channel selection interaction has expired');
            return;
        }

        if (!interaction.guild) {
            console.log(`Channel selection in DM for ${interaction.user.tag} - need to find guild`);
            
            const targetGuild = interaction.client.guilds.cache.find(guild => 
                guild.members.cache.has(interaction.user.id)
            );
            
            if (!targetGuild) {
                console.error(`❌ Could not find guild for user ${interaction.user.tag}`);
                await safeReply(interaction, {
                    content: '❌ Could not find the server. Please make sure you are still a member of the Creatok server.',
                    ephemeral: true
                });
                return;
            }

            const member = targetGuild.members.cache.get(interaction.user.id);
            if (!member) {
                console.error(`❌ Could not find member ${interaction.user.tag} in guild`);
                await safeReply(interaction, {
                    content: '❌ Could not find your member profile. Please rejoin the server if you left.',
                    ephemeral: true
                });
                return;
            }

            await assignRoleAndRedirect(interaction, targetGuild, member, regionName, channelType);
            return;
        }

        await assignRoleAndRedirect(interaction, interaction.guild, interaction.member, regionName, channelType);

    } catch (error) {
        console.error(`Error in handleChannelSelection for ${regionName} ${channelType}:`, error);
        
        await safeReply(interaction, {
            content: '❌ Failed to complete setup. Please try again later.',
            ephemeral: true
        });
    }
}

/**
 * Helper function to assign role and redirect to channel
 */
async function assignRoleAndRedirect(interaction, guild, member, regionName, channelType) {
    try {
        const roleMapping = {
            'US': config.roles.usRegion,
            'UK': config.roles.ukRegion,
            'EU': config.roles.euRegion
        };
        
        const roleId = roleMapping[regionName];
        
        console.log(`Looking for role: ${regionName} with ID: ${roleId}`);
        
        if (!roleId) {
            console.error(`❌ ${regionName} role ID not configured in config.js`);
            await safeReply(interaction, {
                content: `❌ ${regionName} role not configured. Please contact an administrator.`,
                ephemeral: true
            });
            return;
        }

        const role = guild.roles.cache.get(roleId);
        if (!role) {
            console.error(`❌ ${regionName} role not found in guild with ID: ${roleId}`);
            await safeReply(interaction, {
                content: `❌ ${regionName} role not found. Please contact an administrator.`,
                ephemeral: true
            });
            return;
        }

        const botMember = guild.members.me;
        if (!botMember.permissions.has(['ManageRoles'])) {
            console.error('❌ Bot does not have ManageRoles permission');
            await safeReply(interaction, {
                content: '❌ Bot does not have permission to manage roles. Please contact an administrator.',
                ephemeral: true
            });
            return;
        }

        if (botMember.roles.highest.position <= role.position) {
            console.error(`❌ Bot role position (${botMember.roles.highest.position}) is not higher than target role position (${role.position})`);
            await safeReply(interaction, {
                content: '❌ Bot cannot assign this role due to role hierarchy. Please contact an administrator.',
                ephemeral: true
            });
            return;
        }

        const regionRoles = [config.roles.usRegion, config.roles.ukRegion, config.roles.euRegion].filter(Boolean);
        const memberRegionRoles = member.roles.cache.filter(role => regionRoles.includes(role.id));
        
        if (memberRegionRoles.size > 0) {
            console.log(`Removing existing region roles: ${memberRegionRoles.map(r => r.name).join(', ')}`);
            await member.roles.remove(memberRegionRoles);
        }

        await member.roles.add(role);
        console.log(`✅ Successfully assigned ${regionName} role to ${interaction.user.tag}`);

        try {
            await updateUserRegion(interaction.user.id, regionName.toLowerCase(), channelType);
            console.log(`✅ Updated database region for ${interaction.user.tag} to ${regionName.toLowerCase()} with ${channelType} preference`);
        } catch (dbError) {
            console.error(`❌ Failed to update database for ${interaction.user.tag}:`, dbError);
        }

        await trackInteraction(interaction.user.id, 'channel_selection');

        let targetChannelId;
        
        if (channelType === 'general') {
            targetChannelId = config.channels.general;
        } else {
            const channelMapping = {
                'US': config.channels.usInterest,
                'UK': config.channels.ukInterest,
                'EU': config.channels.euInterest
            };
            targetChannelId = channelMapping[regionName];
        }

        const targetChannel = guild.channels.cache.get(targetChannelId);
        const channelMention = targetChannel ? `<#${targetChannelId}>` : 'the selected channel';

        // Use update instead of reply since this is usually from a button interaction
        try {
            await interaction.update({
                content: `Click here to go to ${channelMention}`,
                embeds: [],
                components: []
            });
        } catch (updateError) {
            // If update fails, try reply as fallback
            await safeReply(interaction, {
                content: `Click here to go to ${channelMention}`,
                ephemeral: true
            });
        }

        console.log(`✅ Channel selection completed and redirected ${interaction.user.tag} to: ${regionName} ${channelType}`);

    } catch (error) {
        console.error(`Error in assignRoleAndRedirect for ${regionName} ${channelType}:`, error);
        throw error;
    }
}

async function handleGettingStarted(interaction) {
    try {
        console.log(`Handling getting started for user: ${interaction.user.tag}`);
        
        await trackInteraction(interaction.user.id, 'getting_started');
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📖 Getting Started with Creatok')
            .setDescription(
                `**Welcome to Creatok! Here's how to get started:**\n\n` +
                `**1️⃣ Read the Rules**\n` +
                `Visit <#${config.channels.rules || 'rules'}> to understand our community guidelines.\n\n` +
                `**2️⃣ Learn How to buy**\n` +
                `Visit <#${config.channels.howItWorks || 'how-to-buy'}> to learn our purchase process\n\n` +
                `**3️⃣ Select Your Region of Interest**\n` +
                `Choose your region of interest for targeted account information\n\n` +
                `**4️⃣ Browse Available Accounts**\n` +
                `Check <#${config.channels.buyaccounts || 'buy-accounts'}> for current account listings.\n\n` +
                `**5️⃣ Ask Questions**\n` +
                `Use <#${config.channels.faq || 'faq'}> for common questions or <#${config.channels.support || 'support'}> for help.\n\n` +
                `**6️⃣ Stay Updated**\n` +
                `Keep an eye on <#${config.channels.announcements || 'announcements'}> for the latest news and offers.\n\n` +
                `**Need immediate help?** Create a support ticket or DM our staff!`
            )
            .setFooter({ text: 'Creatok - Your TikTok Shop Account Solution' })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

        console.log(`✅ Getting started guide sent to ${interaction.user.tag}`);

    } catch (error) {
        console.error('Error in handleGettingStarted:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Failed to load getting started guide. Please try again later.',
                ephemeral: true
            });
        }
    }
}

async function handleServerWalkthrough(interaction) {
    try {
        console.log(`Handling server walkthrough for user: ${interaction.user.tag}`);
        
        await trackInteraction(interaction.user.id, 'server_walkthrough');
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🎥 Server Walkthrough Video')
            .setDescription(
                `**Watch our comprehensive server walkthrough to learn:**\n\n` +
                `• How to navigate our Discord server\n` +
                `• How to purchase accounts safely\n` +
                `• Tips for new TikTok Shop creators\n\n` +
                `**Video Link:** [Watch Server Walkthrough](https://your-video-link.com)\n\n` +
                `*This video covers everything you need to know to get started with Creatok services.*`
            )
            .setFooter({ text: 'Video Duration: ~5 minutes' })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            ephemeral: true
        });

        console.log(`✅ Server walkthrough sent to ${interaction.user.tag}`);

    } catch (error) {
        console.error('Error in handleServerWalkthrough:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Failed to load server walkthrough. Please try again later.',
                ephemeral: true
            });
        }
    }
}