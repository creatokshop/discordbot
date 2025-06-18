const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Helper functions for FAQ management
async function loadFaq() {
    const faqDataPath = path.join(process.cwd(), 'data', 'faq.json');
    try {
        await fs.mkdir(path.dirname(faqDataPath), { recursive: true });
        const data = await fs.readFile(faqDataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const defaultFaq = {
            title: "❓ FREQUENTLY ASKED QUESTIONS",
            color: "#4CAF50",
            intro: "Here are the most frequently asked questions and their answers:",
            questions: [
                {
                    number: "1️⃣",
                    question: "Are these accounts legitimate?",
                    answer: "Yes, all accounts are 100% legitimate and verified. We source them through official channels."
                },
                {
                    number: "2️⃣",
                    question: "How long does account transfer take?",
                    answer: "Account transfers typically take 24 hours to complete once payment is confirmed."
                },
                {
                    number: "3️⃣",
                    question: "Can I access Verified account from anywhere?",
                    answer: "Yes, you can access your account from anywhere in the world with our custom APK."
                },
                {
                    number: "4️⃣",
                    question: "Is the Creativity Rewards Program guaranteed?",
                    answer: "Both Tiktok Shop for Creator and Creativity Rewards Programs are guaranteed."
                },
                {
                    number: "5️⃣",
                    question: "Do you offer refunds?",
                    answer: "We offer refunds within 15 days if there is a problem with the account."
                },
                {
                    number: "6️⃣",
                    question: "How do I use the custom APK?",
                    answer: "Download instructions and APK files are provided after purchase. Check <#1372024055376642180> for help."
                }
            ],
            footer: "Creatok FAQ Bot"
        };
        await saveFaq(defaultFaq);
        return defaultFaq;
    }
}

async function saveFaq(faq) {
    const faqDataPath = path.join(process.cwd(), 'data', 'faq.json');
    await fs.writeFile(faqDataPath, JSON.stringify(faq, null, 2));
}

async function loadFaqMessageId() {
    try {
        const data = await fs.readFile(path.join(process.cwd(), 'data', 'faqMessageId.json'), 'utf8');
        return JSON.parse(data).faqMessageId;
    } catch (error) {
        return null;
    }
}

async function saveFaqMessageId(messageId) {
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
    await fs.writeFile(
        path.join(process.cwd(), 'data', 'faqMessageId.json'), 
        JSON.stringify({ faqMessageId: messageId }, null, 2)
    );
}

function createFaqEmbed(faqData) {
    // Create the full question and answer text
    const questionsList = faqData.questions.map(q => `${q.number} **${q.question}**\n${q.answer}`).join('\n\n');
    const description = `${faqData.intro}\n\n${questionsList}`;
    
    return new EmbedBuilder()
        .setColor(faqData.color)
        .setTitle(faqData.title)
        .setDescription(description)
        .setFooter({ text: faqData.footer })
        .setTimestamp();
}

async function deployFaq(interaction, forceNew = false) {
    try {
        const config = require('../../config/config.js');
        const guild = await interaction.client.guilds.fetch(config.guildId);
        const faqChannel = await guild.channels.fetch(config.channels.faq);
        
        if (!faqChannel) {
            await interaction.reply({ content: '❌ FAQ channel not found.', ephemeral: true });
            return;
        }

        const faqData = await loadFaq();
        const faqEmbed = createFaqEmbed(faqData);
        let faqMessageId = await loadFaqMessageId();
        
        let message;
        
        if (faqMessageId && !forceNew) {
            try {
                message = await faqChannel.messages.fetch(faqMessageId);
                await message.edit({ embeds: [faqEmbed] });
                await interaction.reply({ content: '✅ FAQ updated successfully!', ephemeral: true });
                return;
            } catch (error) {
                console.log('⚠️ Previous FAQ message not found, creating new one...');
            }
        }
        
        message = await faqChannel.send({ embeds: [faqEmbed] });
        await saveFaqMessageId(message.id);
        
        await interaction.reply({ content: '✅ FAQ sent successfully!', ephemeral: true });
        
    } catch (error) {
        console.error('Error deploying FAQ:', error);
        await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('faq')
        .setDescription('Manage server FAQ')
        .addSubcommand(subcommand =>
            subcommand
                .setName('deploy')
                .setDescription('Deploy or update the FAQ message')
                .addBooleanOption(option =>
                    option.setName('new')
                        .setDescription('Create a new message instead of updating existing')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new FAQ question')
                .addStringOption(option =>
                    option.setName('question')
                        .setDescription('The question to add')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('answer')
                        .setDescription('The answer to the question')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a question by number')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Question number to remove (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing question or answer')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Question number to edit (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
                .addStringOption(option =>
                    option.setName('question')
                        .setDescription('New question text (leave empty to keep current)')
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('answer')
                        .setDescription('New answer text (leave empty to keep current)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('title')
                .setDescription('Change the FAQ title')
                .addStringOption(option =>
                    option.setName('newtitle')
                        .setDescription('New title for the FAQ')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('intro')
                .setDescription('Change the intro text')
                .addStringOption(option =>
                    option.setName('newintro')
                        .setDescription('New intro text')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Change the FAQ embed color')
                .addStringOption(option =>
                    option.setName('hexcolor')
                        .setDescription('Hex color code (e.g., #4CAF50)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('footer')
                .setDescription('Change the FAQ footer')
                .addStringOption(option =>
                    option.setName('newfooter')
                        .setDescription('New footer text')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View a specific question and answer')
                .addIntegerOption(option =>
                    option.setName('number')
                        .setDescription('Question number to view (1-based)')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all questions and answers for editing')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset FAQ to default')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            const faqData = await loadFaq();
            
            switch (subcommand) {
                case 'deploy':
                    const forceNew = interaction.options.getBoolean('new') || false;
                    await deployFaq(interaction, forceNew);
                    break;
                    
                case 'add':
                    const newQuestion = interaction.options.getString('question');
                    const newAnswer = interaction.options.getString('answer');
                    const questionNumber = faqData.questions.length + 1;
                    const emoji = `${questionNumber}️⃣`;
                    
                    faqData.questions.push({
                        number: emoji,
                        question: newQuestion,
                        answer: newAnswer
                    });
                    
                    await saveFaq(faqData);
                    await deployFaq(interaction);
                    break;
                    
                case 'remove':
                    const removeNumber = interaction.options.getInteger('number');
                    if (removeNumber > faqData.questions.length) {
                        await interaction.reply({ 
                            content: `❌ Question ${removeNumber} doesn't exist. There are only ${faqData.questions.length} questions.`, 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    faqData.questions.splice(removeNumber - 1, 1);
                    
                    // Renumber remaining questions
                    faqData.questions = faqData.questions.map((q, index) => ({
                        ...q,
                        number: `${index + 1}️⃣`
                    }));
                    
                    await saveFaq(faqData);
                    await deployFaq(interaction);
                    break;
                    
                case 'edit':
                    const editNumber = interaction.options.getInteger('number');
                    const editQuestion = interaction.options.getString('question');
                    const editAnswer = interaction.options.getString('answer');
                    
                    if (editNumber > faqData.questions.length) {
                        await interaction.reply({ 
                            content: `❌ Question ${editNumber} doesn't exist. There are only ${faqData.questions.length} questions.`, 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    if (editQuestion) {
                        faqData.questions[editNumber - 1].question = editQuestion;
                    }
                    if (editAnswer) {
                        faqData.questions[editNumber - 1].answer = editAnswer;
                    }
                    
                    if (!editQuestion && !editAnswer) {
                        await interaction.reply({ 
                            content: '❌ Please provide either a new question or answer to edit.', 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    await saveFaq(faqData);
                    await deployFaq(interaction);
                    break;
                    
                case 'title':
                    const newTitle = interaction.options.getString('newtitle');
                    faqData.title = newTitle;
                    await saveFaq(faqData);
                    await deployFaq(interaction);
                    break;
                    
                case 'intro':
                    const newIntro = interaction.options.getString('newintro');
                    faqData.intro = newIntro;
                    await saveFaq(faqData);
                    await deployFaq(interaction);
                    break;
                    
                case 'color':
                    const newColor = interaction.options.getString('hexcolor');
                    if (!newColor.match(/^#[0-9A-F]{6}$/i)) {
                        await interaction.reply({ 
                            content: '❌ Invalid hex color format. Please use format like #4CAF50', 
                            ephemeral: true 
                        });
                        return;
                    }
                    faqData.color = newColor;
                    await saveFaq(faqData);
                    await deployFaq(interaction);
                    break;
                    
                case 'footer':
                    const newFooter = interaction.options.getString('newfooter');
                    faqData.footer = newFooter;
                    await saveFaq(faqData);
                    await deployFaq(interaction);
                    break;
                    
                case 'view':
                    const viewNumber = interaction.options.getInteger('number');
                    if (viewNumber > faqData.questions.length) {
                        await interaction.reply({ 
                            content: `❌ Question ${viewNumber} doesn't exist. There are only ${faqData.questions.length} questions.`, 
                            ephemeral: true 
                        });
                        return;
                    }
                    
                    const question = faqData.questions[viewNumber - 1];
                    const viewEmbed = new EmbedBuilder()
                        .setColor(faqData.color)
                        .setTitle(`${question.number} ${question.question}`)
                        .setDescription(question.answer)
                        .setFooter({ text: 'FAQ Question Details' });
                    
                    await interaction.reply({ embeds: [viewEmbed], ephemeral: true });
                    break;
                    
                case 'list':
                    const questionsList = faqData.questions.map((q, index) => 
                        `**${index + 1}.** ${q.question}\n*Answer:* ${q.answer}\n`
                    ).join('\n');
                    
                    const listEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('📝 Current FAQ Questions & Answers')
                        .addFields(
                            { name: 'Title', value: faqData.title, inline: false },
                            { name: 'Intro Text', value: faqData.intro, inline: false },
                            { name: 'Color', value: faqData.color, inline: true },
                            { name: 'Footer', value: faqData.footer, inline: true }
                        )
                        .setDescription(questionsList || 'No questions found.')
                        .setFooter({ text: 'Use /faq edit [number] to modify questions' });
                    
                    await interaction.reply({ embeds: [listEmbed], ephemeral: true });
                    break;
                    
                case 'reset':
                    const defaultFaq = {
                        title: "❓ FREQUENTLY ASKED QUESTIONS",
                        color: "#4CAF50",
                        intro: "Here are the most frequently asked questions and their answers:",
                        questions: [
                            {
                    number: "1️⃣",
                    question: "Are these accounts legitimate?",
                    answer: "Yes, all accounts are 100% legitimate and verified. We source them through official channels."
                },
                {
                    number: "2️⃣",
                    question: "How long does account transfer take?",
                    answer: "Account transfers typically take 24 hours to complete once payment is confirmed."
                },
                {
                    number: "3️⃣",
                    question: "Can I access Verified account from anywhere?",
                    answer: "Yes, you can access your account from anywhere in the world with our custom APK."
                },
                {
                    number: "4️⃣",
                    question: "Is the Creativity Rewards Program guaranteed?",
                    answer: "Both Tiktok Shop for Creator and Creativity Rewards Programs are guaranteed."
                },
                {
                    number: "5️⃣",
                    question: "Do you offer refunds?",
                    answer: "We offer refunds within 15 days if there is a problem with the account."
                },
                {
                    number: "6️⃣",
                    question: "How do I use the custom APK?",
                    answer: "Download instructions and APK files are provided after purchase. Check <#1372024055376642180> for help."
                }
                        ],
                        footer: "Creatok FAQ Bot"
                    };
                    await saveFaq(defaultFaq);
                    await deployFaq(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error handling FAQ command:', error);
            if (!interaction.replied) {
                await interaction.reply({ 
                    content: '❌ An error occurred while processing your command.', 
                    ephemeral: true 
                });
            }
        }
    },
};