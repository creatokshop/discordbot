// // commands/utility/setup-rules.js
// const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
// const { setupRulesCommand } = require('../../setupRules.js');

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName('setup-rules')
//         .setDescription('Set up the rules message in the rules channel')
//         .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
//     async execute(interaction) {
//         await setupRulesCommand(interaction);
//     }
// };

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Helper functions for rules management
async function loadRules() {
    const rulesDataPath = path.join(process.cwd(), 'data', 'rules.json');
    try {
        await fs.mkdir(path.dirname(rulesDataPath), { recursive: true });
        const data = await fs.readFile(rulesDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const defaultRules = {
            title: "📜 Server Rules",
            color: "#FFD700",
            rules: [
                "**1️⃣ No spamming or excessive messaging**",
                "**2️⃣ Be respectful to all members and staff**",
                "**3️⃣ No sharing of personal information**",
                "**4️⃣ No promoting other services**",
                "**5️⃣ Use appropriate channels for inquiries**",
                "**6️⃣ Follow Discord's Terms of Service**"
            ],
            footer: "⚠️ **Violation of these rules may result in warning or removal from the server.**\n\n✅ **React with ✅ to acknowledge these rules and gain access to the server.**"
        };
        await saveRules(defaultRules);
        return defaultRules;
    }
}

async function saveRules(rules) {
    const rulesDataPath = path.join(process.cwd(), 'data', 'rules.json');
    await fs.writeFile(rulesDataPath, JSON.stringify(rules, null, 2));
}

async function loadMessageId() {
    try {
        const data = await fs.readFile(path.join(process.cwd(), 'data', 'messageId.json'), 'utf8');
        return JSON.parse(data).rulesMessageId;
    } catch (error) {
        return null;
    }
}

async function saveMessageId(messageId) {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(
        path.join(process.cwd(), 'data', 'messageId.json'), 
        JSON.stringify({ rulesMessageId: messageId }, null, 2)
    );
}

function createRulesEmbed(rulesData) {
    const description = rulesData.rules.join('\n\n') + '\n\n' + rulesData.footer;
    return new EmbedBuilder()
        .setColor(rulesData.color)
        .setTitle(rulesData.title)
        .setDescription(description)
        .setFooter({ text: 'Creatok Moderation Team' })
        .setTimestamp();
}

async function deployRules(interaction, forceNew = false) {
    try {
        const config = require('../../config/config.js');
        const guild = await interaction.client.guilds.fetch(config.guildId);
        const rulesChannel = await guild.channels.fetch(config.channels.rules);
        
        if (!rulesChannel) {
            await interaction.reply({ content: '❌ Rules channel not found.', ephemeral: true });
            return;
        }

        const rulesData = await loadRules();
        const rulesEmbed = createRulesEmbed(rulesData);
        let rulesMessageId = await loadMessageId();
        
        let message;
        
        if (rulesMessageId && !forceNew) {
            try {
                message = await rulesChannel.messages.fetch(rulesMessageId);
                await message.edit({ embeds: [rulesEmbed] });
                await interaction.reply({ content: '✅ Rules updated successfully!', ephemeral: true });
                return;
            } catch (error) {
                console.log('⚠️ Previous rules message not found, creating new one...');
            }
        }
        
        message = await rulesChannel.send({ embeds: [rulesEmbed] });
        await message.react('✅');
        await saveMessageId(message.id);
        
        await interaction.reply({ content: '✅ Rules message sent successfully!', ephemeral: true });
        
    } catch (error) {
        console.error('Error deploying rules:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Manage server rules')
        .addSubcommand(subcommand =>
            subcommand
                .setName('deploy')
                .setDescription('Deploy or update the rules message')
                .addBooleanOption(option =>
                    option.setName('new')
                        .setDescription('Create a new message instead of updating existing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new rule')
                .addStringOption(option =>
                    option.setName('rule')
                        .setDescription('The rule to add')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a rule by number')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Rule number to remove (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing rule')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Rule number to edit (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addStringOption(option =>
                    option.setName('newtext')
                        .setDescription('New text for the rule')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List current rules for editing')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset rules to default')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            const rulesData = await loadRules();
            
            switch (subcommand) {
                case 'deploy':
                    const forceNew = interaction.options.getBoolean('new') || false;
                    await deployRules(interaction, forceNew);
                    break;
                    
                case 'add':
                    const newRule = interaction.options.getString('rule');
                    const ruleNumber = rulesData.rules.length + 1;
                    const formattedRule = `**${ruleNumber}️⃣ ${newRule}**`;
                    
                    rulesData.rules.push(formattedRule);
                    await saveRules(rulesData);
                    await deployRules(interaction);
                    break;
                    
                case 'remove':
                    const removeNumber = interaction.options.getInteger('number');
                    if (removeNumber > rulesData.rules.length) {
                        await interaction.reply({ 
                            content: `❌ Rule ${removeNumber} doesn't exist. There are only ${rulesData.rules.length} rules.`, 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    rulesData.rules.splice(removeNumber - 1, 1);
                    
                    // Renumber remaining rules
                    rulesData.rules = rulesData.rules.map((rule, index) => {
                        const newNumber = index + 1;
                        return rule.replace(/\*\*\d+️⃣/, `**${newNumber}️⃣`);
                    });
                    
                    await saveRules(rulesData);
                    await deployRules(interaction);
                    break;
                    
                case 'edit':
                    const editNumber = interaction.options.getInteger('number');
                    const newText = interaction.options.getString('newtext');
                    
                    if (editNumber > rulesData.rules.length) {
                        await interaction.reply({ 
                            content: `❌ Rule ${editNumber} doesn't exist. There are only ${rulesData.rules.length} rules.`, 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    rulesData.rules[editNumber - 1] = `**${editNumber}️⃣ ${newText}**`;
                    await saveRules(rulesData);
                    await deployRules(interaction);
                    break;
                    
                case 'list':
                    const rulesList = rulesData.rules.map((rule, index) => 
                        `${index + 1}. ${rule.replace(/\*\*/g, '')}`
                    ).join('\n');
                    
                    const listEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('📝 Current Rules (for editing)')
                        .setDescription(rulesList || 'No rules found.')
                        .setFooter({ text: 'Use /rules edit [number] [new text] to modify a rule' });
                    
                    await interaction.reply({ embeds: [listEmbed], ephemeral: true });
                    break;
                    
                case 'reset':
                    const defaultRules = {
                        title: "📜 Server Rules",
                        color: "#FFD700",
                        rules: [
                            "**1️⃣ No spamming or excessive messaging**",
                            "**2️⃣ Be respectful to all members and staff**",
                            "**3️⃣ No sharing of personal information**",
                            "**4️⃣ No promoting other services**",
                            "**5️⃣ Use appropriate channels for inquiries**",
                            "**6️⃣ Follow Discord's Terms of Service**"
                        ],
                        footer: "⚠️ **Violation of these rules may result in warning or removal from the server.**\n\n✅ **React with ✅ to acknowledge these rules and gain access to the server.**"
                    };
                    await saveRules(defaultRules);
                    await deployRules(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling rules command:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ An error occurred while processing your command.', 
                    ephemeral: true 
                });
            }
        }
    },
};