const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { 
    createDiscountCode, 
    getDiscountCodes, 
    updateDiscountCode, 
    deleteDiscountCode,
    validateDiscountCode 
} = require('../../utils/database.js');

const data = new SlashCommandBuilder()
    .setName('discount')
    .setDescription('Manage discount codes')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Create a new discount code')
            .addStringOption(option =>
                option.setName('code')
                    .setDescription('Discount code (will be converted to uppercase)')
                    .setRequired(true)
                    .setMaxLength(20))
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('Discount type')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Percentage', value: 'percentage' },
                        { name: 'Fixed Amount', value: 'fixed_amount' }
                    ))
            .addNumberOption(option =>
                option.setName('value')
                    .setDescription('Discount value (percentage: 1-99, fixed: dollar amount)')
                    .setRequired(true)
                    .setMinValue(0.01))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('Description of the discount')
                    .setRequired(true)
                    .setMaxLength(200))
            .addIntegerOption(option =>
                option.setName('usage_limit')
                    .setDescription('Total usage limit (leave empty for unlimited)')
                    .setMinValue(1))
            .addIntegerOption(option =>
                option.setName('user_limit')
                    .setDescription('Uses per user (default: 1)')
                    .setMinValue(1)
                    .setMaxValue(10))
            .addNumberOption(option =>
                option.setName('minimum_order')
                    .setDescription('Minimum order amount required')
                    .setMinValue(0))
            .addNumberOption(option =>
                option.setName('maximum_discount')
                    .setDescription('Maximum discount amount (for percentage discounts)')
                    .setMinValue(0))
            .addStringOption(option =>
                option.setName('valid_until')
                    .setDescription('Expiration date (YYYY-MM-DD format, optional)'))
            .addStringOption(option =>
                option.setName('regions')
                    .setDescription('Allowed regions (comma-separated: US,UK,EU,Non-TTS)'))
            .addStringOption(option =>
                option.setName('account_types')
                    .setDescription('Allowed account types (comma-separated)'))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all discount codes')
            .addBooleanOption(option =>
                option.setName('active_only')
                    .setDescription('Show only active codes (default: false)')
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('info')
            .setDescription('Get detailed information about a discount code')
            .addStringOption(option =>
                option.setName('code')
                    .setDescription('Discount code to check')
                    .setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('toggle')
            .setDescription('Toggle a discount code active/inactive')
            .addStringOption(option =>
                option.setName('code')
                    .setDescription('Discount code to toggle')
                    .setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('update')
            .setDescription('Update a discount code')
            .addStringOption(option =>
                option.setName('code')
                    .setDescription('Discount code to update')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('New description'))
            .addIntegerOption(option =>
                option.setName('usage_limit')
                    .setDescription('New usage limit'))
            .addIntegerOption(option =>
                option.setName('user_limit')
                    .setDescription('New user limit'))
            .addNumberOption(option =>
                option.setName('minimum_order')
                    .setDescription('New minimum order amount'))
            .addStringOption(option =>
                option.setName('valid_until')
                    .setDescription('New expiration date (YYYY-MM-DD)'))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('delete')
            .setDescription('Delete a discount code')
            .addStringOption(option =>
                option.setName('code')
                    .setDescription('Discount code to delete')
                    .setRequired(true))
            .addBooleanOption(option =>
                option.setName('confirm')
                    .setDescription('Confirm deletion (must be true)')
                    .setRequired(true))
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('test')
            .setDescription('Test a discount code validation')
            .addStringOption(option =>
                option.setName('code')
                    .setDescription('Discount code to test')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('region')
                    .setDescription('Test region')
                    .setRequired(true)
                    .addChoices(
                        { name: 'US', value: 'US' },
                        { name: 'UK', value: 'UK' },
                        { name: 'EU', value: 'EU' },
                        { name: 'Non-TTS', value: 'Non-TTS' }
                    ))
            .addStringOption(option =>
                option.setName('account_type')
                    .setDescription('Test account type')
                    .setRequired(true))
            .addNumberOption(option =>
                option.setName('price')
                    .setDescription('Test order price')
                    .setRequired(true)
                    .setMinValue(1))
    );

async function execute(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const staffMember = interaction.user.tag;

        switch (subcommand) {
            case 'create':
                await handleCreateDiscount(interaction, staffMember);
                break;
            case 'list':
                await handleListDiscounts(interaction);
                break;
            case 'info':
                await handleDiscountInfo(interaction);
                break;
            case 'toggle':
                await handleToggleDiscount(interaction);
                break;
            case 'update':
                await handleUpdateDiscount(interaction);
                break;
            case 'delete':
                await handleDeleteDiscount(interaction);
                break;
            case 'test':
                await handleTestDiscount(interaction);
                break;
            default:
                await interaction.editReply({ content: '❌ Unknown subcommand' });
        }
    } catch (error) {
        console.error('Error in discount command:', error);
        const errorMessage = '❌ An error occurred while processing the discount command.';
        
        if (interaction.deferred) {
            await interaction.editReply({ content: errorMessage });
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
}

async function handleCreateDiscount(interaction, staffMember) {
    try {
        const code = interaction.options.getString('code').toUpperCase();
        const type = interaction.options.getString('type');
        const value = interaction.options.getNumber('value');
        const description = interaction.options.getString('description');
        const usageLimit = interaction.options.getInteger('usage_limit');
        const userLimit = interaction.options.getInteger('user_limit') || 1;
        const minimumOrder = interaction.options.getNumber('minimum_order') || 0;
        const maximumDiscount = interaction.options.getNumber('maximum_discount');
        const validUntil = interaction.options.getString('valid_until');
        const regions = interaction.options.getString('regions');
        const accountTypes = interaction.options.getString('account_types');

        // Validate percentage value
        if (type === 'percentage' && (value < 1 || value > 99)) {
            await interaction.editReply({ content: '❌ Percentage discount must be between 1 and 99.' });
            return;
        }

        // Parse expiration date
        let expirationDate = null;
        if (validUntil) {
            expirationDate = new Date(validUntil);
            if (isNaN(expirationDate)) {
                await interaction.editReply({ content: '❌ Invalid date format. Use YYYY-MM-DD.' });
                return;
            }
        }

        // Parse regions and account types
        const allowedRegions = regions ? regions.split(',').map(r => r.trim().toUpperCase()) : [];
        const allowedAccountTypes = accountTypes ? accountTypes.split(',').map(t => t.trim()) : [];

        const discountData = {
            code: code,
            type: type,
            value: value,
            description: description,
            usageLimit: usageLimit,
            userLimit: userLimit,
            minimumOrderAmount: minimumOrder,
            maximumDiscount: maximumDiscount,
            validUntil: expirationDate,
            allowedRegions: allowedRegions,
            allowedAccountTypes: allowedAccountTypes
        };

        const discount = await createDiscountCode(discountData, staffMember);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Discount Code Created Successfully')
            .addFields(
                { name: '🎫 Code', value: discount.code, inline: true },
                { name: '📊 Type', value: discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`, inline: true },
                { name: '📝 Description', value: discount.description, inline: false },
                { name: '🔢 Usage Limit', value: discount.usageLimit ? discount.usageLimit.toString() : 'Unlimited', inline: true },
                { name: '👤 User Limit', value: discount.userLimit.toString(), inline: true },
                { name: '💰 Min Order', value: `$${discount.minimumOrderAmount}`, inline: true }
            )
            .setFooter({ text: `Created by ${staffMember}` })
            .setTimestamp();

        if (discount.maximumDiscount) {
            embed.addFields({ name: '🎯 Max Discount', value: `$${discount.maximumDiscount}`, inline: true });
        }

        if (discount.validUntil) {
            embed.addFields({ name: '⏰ Expires', value: discount.validUntil.toDateString(), inline: true });
        }

        if (discount.allowedRegions.length > 0) {
            embed.addFields({ name: '🌍 Regions', value: discount.allowedRegions.join(', '), inline: true });
        }

        if (discount.allowedAccountTypes.length > 0) {
            embed.addFields({ name: '📦 Account Types', value: discount.allowedAccountTypes.join(', '), inline: false });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error creating discount:', error);
        await interaction.editReply({ 
            content: error.message.includes('already exists') ? 
                '❌ Discount code already exists.' : 
                '❌ Failed to create discount code.'
        });
    }
}

async function handleListDiscounts(interaction) {
    try {
        const activeOnly = interaction.options.getBoolean('active_only') || false;
        const discounts = await getDiscountCodes(activeOnly);

        if (discounts.length === 0) {
            await interaction.editReply({ 
                content: activeOnly ? '📝 No active discount codes found.' : '📝 No discount codes found.' 
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🎫 Discount Codes ${activeOnly ? '(Active Only)' : '(All)'}`)
            .setDescription(`Found ${discounts.length} discount code${discounts.length > 1 ? 's' : ''}`)
            .setFooter({ text: `Use /discount info <code> for detailed information` })
            .setTimestamp();

        // Group discounts into fields (Discord embed field limit)
        const discountList = discounts.map(discount => {
            const status = discount.isActive ? '🟢' : '🔴';
            const usage = discount.usageLimit ? 
                `${discount.usageCount}/${discount.usageLimit}` : 
                discount.usageCount.toString();
            const type = discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`;
            
            return `${status} **${discount.code}** - ${type} (Used: ${usage})`;
        });

        // Split into multiple fields if too long
        const maxFieldLength = 1024;
        let currentField = '';
        let fieldIndex = 1;

        for (const discountLine of discountList) {
            if (currentField.length + discountLine.length + 1 > maxFieldLength) {
                embed.addFields({ 
                    name: fieldIndex === 1 ? 'Codes' : `Codes (continued)`, 
                    value: currentField, 
                    inline: false 
                });
                currentField = discountLine;
                fieldIndex++;
            } else {
                currentField += (currentField ? '\n' : '') + discountLine;
            }
        }

        if (currentField) {
            embed.addFields({ 
                name: fieldIndex === 1 ? 'Codes' : `Codes (continued)`, 
                value: currentField, 
                inline: false 
            });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error listing discounts:', error);
        await interaction.editReply({ content: '❌ Failed to retrieve discount codes.' });
    }
}

async function handleDiscountInfo(interaction) {
    try {
        const code = interaction.options.getString('code').toUpperCase();
        const discounts = await getDiscountCodes(false);
        const discount = discounts.find(d => d.code === code);

        if (!discount) {
            await interaction.editReply({ content: `❌ Discount code '${code}' not found.` });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(discount.isActive ? '#00FF00' : '#FF0000')
            .setTitle(`🎫 Discount Code: ${discount.code}`)
            .addFields(
                { name: '📊 Type', value: discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`, inline: true },
                { name: '🟢 Status', value: discount.isActive ? 'Active' : 'Inactive', inline: true },
                { name: '📝 Description', value: discount.description, inline: false },
                { name: '🔢 Usage Count', value: discount.usageCount.toString(), inline: true },
                { name: '🎯 Usage Limit', value: discount.usageLimit ? discount.usageLimit.toString() : 'Unlimited', inline: true },
                { name: '👤 User Limit', value: discount.userLimit.toString(), inline: true },
                { name: '💰 Min Order', value: `$${discount.minimumOrderAmount}`, inline: true },
                { name: '📅 Created', value: discount.createdAt.toDateString(), inline: true },
                { name: '👨‍💼 Created By', value: discount.createdBy, inline: true }
            )
            .setTimestamp();

        if (discount.maximumDiscount) {
            embed.addFields({ name: '🎯 Max Discount', value: `$${discount.maximumDiscount}`, inline: true });
        }

        if (discount.validFrom && discount.validFrom > new Date()) {
            embed.addFields({ name: '⏰ Valid From', value: discount.validFrom.toDateString(), inline: true });
        }

        if (discount.validUntil) {
            embed.addFields({ name: '⏰ Expires', value: discount.validUntil.toDateString(), inline: true });
        }

        if (discount.allowedRegions.length > 0) {
            embed.addFields({ name: '🌍 Allowed Regions', value: discount.allowedRegions.join(', '), inline: true });
        }

        if (discount.allowedAccountTypes.length > 0) {
            embed.addFields({ name: '📦 Allowed Account Types', value: discount.allowedAccountTypes.join(', '), inline: false });
        }

        // Show recent usage
        if (discount.usedBy.length > 0) {
            const recentUsage = discount.usedBy
                .slice(-5) // Last 5 uses
                .map(usage => `${usage.userTag} - $${usage.discountAmount} (${usage.usedAt.toDateString()})`)
                .join('\n');
            
            embed.addFields({ name: '📊 Recent Usage (Last 5)', value: recentUsage, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error getting discount info:', error);
        await interaction.editReply({ content: '❌ Failed to retrieve discount information.' });
    }
}

async function handleToggleDiscount(interaction) {
    try {
        const code = interaction.options.getString('code').toUpperCase();
        const discounts = await getDiscountCodes(false);
        const discount = discounts.find(d => d.code === code);

        if (!discount) {
            await interaction.editReply({ content: `❌ Discount code '${code}' not found.` });
            return;
        }

        const newStatus = !discount.isActive;
        await updateDiscountCode(code, { isActive: newStatus });

        const embed = new EmbedBuilder()
            .setColor(newStatus ? '#00FF00' : '#FF0000')
            .setTitle('✅ Discount Code Updated')
            .addFields(
                { name: '🎫 Code', value: code, inline: true },
                { name: '🟢 Status', value: newStatus ? 'Active' : 'Inactive', inline: true }
            )
            .setFooter({ text: `Updated by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error toggling discount:', error);
        await interaction.editReply({ content: '❌ Failed to toggle discount code.' });
    }
}

async function handleUpdateDiscount(interaction) {
    try {
        const code = interaction.options.getString('code').toUpperCase();
        const description = interaction.options.getString('description');
        const usageLimit = interaction.options.getInteger('usage_limit');
        const userLimit = interaction.options.getInteger('user_limit');
        const minimumOrder = interaction.options.getNumber('minimum_order');
        const validUntil = interaction.options.getString('valid_until');

        const updateData = {};
        
        if (description) updateData.description = description;
        if (usageLimit !== null) updateData.usageLimit = usageLimit;
        if (userLimit !== null) updateData.userLimit = userLimit;
        if (minimumOrder !== null) updateData.minimumOrderAmount = minimumOrder;
        
        if (validUntil) {
            const expirationDate = new Date(validUntil);
            if (isNaN(expirationDate)) {
                await interaction.editReply({ content: '❌ Invalid date format. Use YYYY-MM-DD.' });
                return;
            }
            updateData.validUntil = expirationDate;
        }

        if (Object.keys(updateData).length === 0) {
            await interaction.editReply({ content: '❌ No update parameters provided.' });
            return;
        }

        const updatedDiscount = await updateDiscountCode(code, updateData);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Discount Code Updated')
            .addFields(
                { name: '🎫 Code', value: updatedDiscount.code, inline: true },
                { name: '📝 Description', value: updatedDiscount.description, inline: false }
            )
            .setFooter({ text: `Updated by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error updating discount:', error);
        await interaction.editReply({ 
            content: error.message.includes('not found') ? 
                '❌ Discount code not found.' : 
                '❌ Failed to update discount code.'
        });
    }
}

async function handleDeleteDiscount(interaction) {
    try {
        const code = interaction.options.getString('code').toUpperCase();
        const confirm = interaction.options.getBoolean('confirm');

        if (!confirm) {
            await interaction.editReply({ 
                content: '❌ You must set confirm to true to delete a discount code.' 
            });
            return;
        }

        await deleteDiscountCode(code);

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('✅ Discount Code Deleted')
            .addFields(
                { name: '🎫 Deleted Code', value: code, inline: true }
            )
            .setFooter({ text: `Deleted by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error deleting discount:', error);
        await interaction.editReply({ 
            content: error.message.includes('not found') ? 
                '❌ Discount code not found.' : 
                '❌ Failed to delete discount code.'
        });
    }
}

async function handleTestDiscount(interaction) {
    try {
        const code = interaction.options.getString('code');
        const region = interaction.options.getString('region');
        const accountType = interaction.options.getString('account_type');
        const price = interaction.options.getNumber('price');

        const orderData = {
            region: region,
            accountType: accountType,
            price: price
        };

        const validation = await validateDiscountCode(code, interaction.user.id, orderData);

        const embed = new EmbedBuilder()
            .setColor(validation.valid ? '#00FF00' : '#FF0000')
            .setTitle(`🧪 Discount Test: ${code.toUpperCase()}`)
            .addFields(
                { name: '✅ Valid', value: validation.valid ? 'Yes' : 'No', inline: true },
                { name: '💰 Original Price', value: `$${price}`, inline: true }
            );

        if (validation.valid) {
            embed.addFields(
                { name: '💸 Discount Amount', value: `$${validation.discountAmount}`, inline: true },
                { name: '💵 Final Price', value: `$${validation.finalPrice}`, inline: true },
                { name: '📊 Discount Type', value: validation.discount.type === 'percentage' ? 
                    `${validation.discount.value}%` : `$${validation.discount.value}`, inline: true }
            );
        } else {
            embed.addFields(
                { name: '❌ Error', value: validation.error, inline: false }
            );
        }

        embed.addFields(
            { name: '🧪 Test Parameters', value: 
                `**Region:** ${region}\n**Account Type:** ${accountType}\n**Price:** $${price}`, inline: false }
        )
        .setFooter({ text: 'This is a test - no actual discount usage recorded' })
        .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Error testing discount:', error);
        await interaction.editReply({ content: '❌ Failed to test discount code.' });
    }
}

module.exports = {
    data,
    execute
};