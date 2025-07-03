const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const config = require('../config/config.js');
const { getOrCreateUser, isConnected } = require('../utils/database.js');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    async execute(client, member) {
        try {
            console.log('guildMemberAdd event triggered for:', member.user.tag);

            // Get the welcome channel
            const welcomeChannelId = config.channels.welcome;
            const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

            if (!welcomeChannel) {
                console.warn(`Welcome channel (${welcomeChannelId}) not found for guild ${member.guild.name}`);
                return;
            }

            // Check bot permissions in the welcome channel
            const botPermissions = welcomeChannel.permissionsFor(member.guild.members.me);
            const requiredPermissions = ['SendMessages', 'EmbedLinks', 'UseExternalEmojis', 'ReadMessageHistory'];
            const missingPermissions = requiredPermissions.filter(perm => !botPermissions.has(perm));

            if (missingPermissions.length > 0) {
                console.error(`❌ Bot missing permissions in welcome channel: ${missingPermissions.join(', ')}`);
                console.error(`Channel: ${welcomeChannel.name} (${welcomeChannel.id})`);
                console.error(`Guild: ${member.guild.name} (${member.guild.id})`);

                try {
                    await welcomeChannel.send(`Welcome ${member.displayName} to Creatok! Please check our rules and get started.`);
                    console.log('✅ Sent fallback welcome message');
                } catch (fallbackError) {
                    console.error('❌ Even fallback message failed:', fallbackError.message);
                }
                return;
            }

            // Create ELEGANT welcome embed for public channel
            const publicWelcomeEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setAuthor({ 
                    name: '🔥 New Member Joined!', 
                    iconURL: client.user.displayAvatarURL() 
                })
               .setDescription(
                    `**Hey ${member.displayName}!**\n\n` +
                    `Welcome to **Creatok** — your TikTok Shop journey starts here.\n\n` +
                    `💌 [Check your **DMs**](https://discord.com/channels/@me) to get started!`
                )
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .setFooter({ 
                    text: '💰 Ready to start your first tiktok business?',
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTimestamp();

            // Create welcome embed for public channel
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setAuthor({ 
                    name: '🔥 New Member Joined!', 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setDescription(
                    `**Hey ${member.displayName}!**\n\n` +
                    `Welcome to **Creatok** — your TikTok Shop journey starts here.\n\n` +
                    `💌 [Check your **DMs**](https://discord.com/channels/@me) to get started!`
                )
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .setFooter({ 
                    text: '💰 Ready to start your first tiktok business?',
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTimestamp();

            // Send welcome message in public channel
            try {
                await welcomeChannel.send({
                    embeds: [welcomeEmbed]
                });
                console.log('✅ Welcome message sent successfully');
            } catch (messageError) {
                console.error('❌ Failed to send welcome message:', messageError.message);

                try {
                    await welcomeChannel.send(`✨ **Hey ${member.displayName}!** Welcome to **Creatok** — [check your **DMs**](https://discord.com/channels/@me) to get started! 💌`);
                    console.log('✅ Text-only welcome message sent');
                } catch (textError) {
                    console.error('❌ All welcome message attempts failed:', textError.message);
                }
            }

            // Create STEP-BY-STEP welcome embed for DM with bot icon
            const detailedWelcomeEmbed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setAuthor({ 
                    name: 'Welcome to Creatok!', 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTitle('**Start Your TikTok Shop Journey**')
                .setDescription(
                    `**STEP 1** 📚\n` +
                    `**Get Started** - Click "Getting Started" below, then scroll down to read the guide\n\n` +
                    
                    `**STEP 2** 🎯\n` +
                    `**Watch Walkthrough** - View our server tour to understand everything\n\n` +
                    
                    `**STEP 3** 📍\n` +
                    `**Choose Your Region** - Select from our available account regions\n\n` +
                    
                    `**STEP 4** 🏠\n` +
                    `**Access Channels** - You'll be invited to your region-specific channel\n\n` +
                    
                    `───────────────────────────────\n` +
                    `💡 **Ready to begin?** Start with the guides first! 👇`
                )
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 128 }))
                .setTimestamp()
                .setFooter({ 
                    text: '✨ Creatok - Premium TikTok Shop Accounts', 
                    iconURL: client.user.displayAvatarURL() 
                });

            const guideRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('getting_started')
                        .setLabel('📖 Getting Started')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('server_walkthrough')
                        .setLabel('🎥 Server Walkthrough')
                        .setStyle(ButtonStyle.Danger)
                );

            const regionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('region_us')
                        .setLabel('🇺🇸 US')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('region_uk')
                        .setLabel('🇬🇧 UK')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('region_eu')
                        .setLabel('🇪🇺 EU')
                        .setStyle(ButtonStyle.Success)
                );

            // Send STEP-BY-STEP welcome message via DM
            try {
                await member.user.send({
                    content: `**Start here ${member.displayName}!**`,
                    embeds: [detailedWelcomeEmbed],
                    components: [guideRow, regionRow]
                });
                console.log(`✅ Step-by-step welcome DM sent to ${member.user.tag}`);
            } catch (dmError) {
                console.error(`❌ Could not send welcome DM to ${member.user.tag}:`, dmError.message);

                // Fallback: Send detailed message in welcome channel if DM fails
                try {
                    await welcomeChannel.send({
                        content: `${member.displayName}, I couldn't DM you! Here's your step-by-step welcome guide:`,
                        embeds: [detailedWelcomeEmbed],
                        components: [guideRow, regionRow]
                    });
                    console.log('✅ Sent step-by-step welcome message in channel as fallback');
                } catch (channelError) {
                    console.error('❌ Could not send step-by-step welcome fallback:', channelError.message);
                }
            }

            // Send PRIVATE rules message via DM
            try {
                const rulesEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('📜 Server Rules')
                    .setDescription(
                        `Please make sure to read and follow these rules to keep our community safe and helpful:\n\n` +
                        `1️⃣ Be respectful and kind.\n` +
                        `2️⃣ No spam, scams, or self-promo.\n` +
                        `3️⃣ Use channels for their intended purpose.\n` +
                        `4️⃣ Do not share personal or private info.\n\n` +
                        `React with ✅ once you've read and understood these rules.`
                    )
                    .setFooter({ text: 'Creatok Moderation Team' })
                    .setTimestamp();

                const rulesMessage = await member.user.send({
                    embeds: [rulesEmbed]
                });

                await rulesMessage.react('✅');
                console.log(`✅ Private rules message sent to ${member.user.tag}`);
            } catch (dmError) {
                console.error(`❌ Could not send rules DM to ${member.user.tag}:`, dmError.message);

                const rulesChannel = member.guild.channels.cache.get(config.channels.rules);
                if (rulesChannel) {
                    try {
                        const rulesEmbed = new EmbedBuilder()
                            .setColor('#FFD700')
                            .setTitle('📜 Server Rules')
                            .setDescription(
                                `Please make sure to read and follow these rules to keep our community safe and helpful:\n\n` +
                                `1️⃣ Be respectful and kind.\n` +
                                `2️⃣ No spam, scams, or self-promo.\n` +
                                `3️⃣ Use channels for their intended purpose.\n` +
                                `4️⃣ Do not share personal or private info.\n\n` +
                                `React with ✅ once you've read and understood these rules.`
                            )
                            .setFooter({ text: 'Creatok Moderation Team' })
                            .setTimestamp();

                        const fallbackMessage = await rulesChannel.send({
                            content: `${member.displayName}, please check your DMs for the rules. If you can't receive DMs, read them here and react with ✅:`,
                            embeds: [rulesEmbed]
                        });

                        await fallbackMessage.react('✅');
                        console.log('✅ Sent fallback rules message in rules channel');
                    } catch (channelError) {
                        console.error('❌ Could not send fallback rules message:', channelError.message);
                    }
                }
            }

            // Assign default role
            if (config.roles && config.roles.member) {
                try {
                    const memberRole = member.guild.roles.cache.get(config.roles.member);
                    if (memberRole) {
                        const botMember = member.guild.members.me;
                        if (
                            botMember.permissions.has('ManageRoles') &&
                            botMember.roles.highest.position > memberRole.position
                        ) {
                            await member.roles.add(memberRole);
                            console.log(`✅ Assigned member role to ${member.user.tag}`);
                        } else {
                            console.warn(`❌ Bot cannot assign member role - permissions or hierarchy issue`);
                        }
                    } else {
                        console.warn(`❌ Member role (${config.roles.member}) not found in guild`);
                    }
                } catch (roleError) {
                    console.error(`❌ Error assigning member role to ${member.user.tag}:`, roleError.message);
                }
            }

            // Add user to DB
            try {
                if (!isConnected()) {
                    console.warn(`MongoDB not connected for ${member.user.tag}. Attempting reconnect...`);
                }

                await getOrCreateUser({
                    id: member.id,
                    tag: member.user.tag,
                    joinedAt: new Date()
                });
                console.log(`✅ Added new member ${member.user.tag} to database`);
            } catch (dbError) {
                console.error(`❌ DB error for ${member.user.tag}:`, dbError.message);
                if (dbError.code) console.error(`Database error code: ${dbError.code}`);
            }

            console.log(`✅ Finished onboarding ${member.user.tag} to ${member.guild.name}`);
        } catch (error) {
            console.error(`Error in guildMemberAdd event for ${member?.user?.tag || 'unknown member'}:`, error);
        }
    }
};