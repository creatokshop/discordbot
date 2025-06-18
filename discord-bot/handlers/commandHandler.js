// commandHandler.js - Loads and registers commands
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('../config/config');


function loadCommands(client) {
    const commands = new Map();
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    // Read all category folders
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        
        // Skip if not a directory
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        // Read all command files in the folder
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            
            // Validate command structure
            if ('data' in command && 'execute' in command) {
                commands.set(command.data.name, command);
                console.log(`✅ Loaded command: ${command.data.name} from ${folder}/${file}`);
            } else {
                console.log(`⚠️ Warning: Command at ${filePath} is missing "data" or "execute" property.`);
            }
        }
    }
    
    client.commands = commands;
    return commands;
}

async function registerCommands(client, guildId) {
    const commandsData = [];
    
    client.commands.forEach(command => {
        commandsData.push(command.data.toJSON());
    });
    
    try {
        const guild = await client.guilds.fetch(guildId);
        await guild.commands.set(commandsData);
        console.log(`✅ Successfully registered ${commandsData.length} commands to guild ${guildId}`);
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

function handleCommandInteraction(client) {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;
        
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
            console.error(`❌ No command matching ${interaction.commandName} was found.`);
            return;
        }
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error executing ${interaction.commandName}:`, error);
            
            const errorMessage = { 
                content: 'There was an error while executing this command!', 
                ephemeral: true 
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    });
}

module.exports = {
    loadCommands,
    registerCommands,
    handleCommandInteraction
};