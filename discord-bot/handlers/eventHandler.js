// Modified eventHandler.js - keeping original code with debugging added
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  console.log('Starting to load event handlers...');
  
  const eventsPath = path.join(__dirname, '..', 'events');
  console.log(`Events directory path: ${eventsPath}`);
  
  // Check if events directory exists
  if (!fs.existsSync(eventsPath)) {
    console.error(`Events directory not found: ${eventsPath}`);
    return;
  }
  
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  // Log all event files found
  console.log(`Found ${eventFiles.length} event files: ${eventFiles.join(', ')}`);
  
  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsPath, file);
      console.log(`Loading event file from: ${filePath}`);
      
      const event = require(filePath);
      console.log(`Event loaded: ${event.name}, once: ${event.once}`);
      
      // THIS IS THE CRITICAL FIX - fixing parameter order
      if (event.once) {
        client.once(event.name, (...args) => {
          console.log(`Executing once event: ${event.name}`);
          // Pass client as first parameter
          event.execute(client, ...args);
        });
      } else {
        client.on(event.name, (...args) => {
          // Pass client as first parameter
          event.execute(client, ...args);
        });
      }
      
      console.log(`Successfully registered event: ${event.name}`);
    } catch (error) {
      console.error(`Error loading event file ${file}:`, error);
    }
  }
  
  console.log(`Loaded ${eventFiles.length} event handlers successfully`);
};