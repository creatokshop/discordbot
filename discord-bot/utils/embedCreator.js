const { EmbedBuilder } = require('discord.js');

/**
 * Creates a standard embed with consistent styling
 * @param {Object} options - Options for the embed
 * @param {String} options.title - The title of the embed
 * @param {String} options.description - The description of the embed
 * @param {String} options.color - The color of the embed (hex code or Discord.js color)
 * @param {Array} options.fields - Array of fields to add to the embed
 * @param {String} options.thumbnail - URL of the thumbnail image
 * @param {String} options.image - URL of the main image
 * @param {Object} options.footer - Footer options {text, iconURL}
 * @param {Object} options.author - Author options {name, iconURL, url}
 * @param {Number} options.timestamp - Timestamp to use (defaults to current time if true)
 * @returns {EmbedBuilder} - The created embed
 */
function createEmbed(options = {}) {
  const embed = new EmbedBuilder();
  
  // Set default color if not provided
  const defaultColor = 0x5865F2; // Discord blurple
  
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  embed.setColor(options.color || defaultColor);
  
  if (options.fields && Array.isArray(options.fields)) {
    options.fields.forEach(field => {
      if (field.name && field.value) {
        embed.addFields({ 
          name: field.name, 
          value: field.value, 
          inline: field.inline ?? false 
        });
      }
    });
  }
  
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  
  if (options.footer) {
    embed.setFooter({ 
      text: options.footer.text || '', 
      iconURL: options.footer.iconURL 
    });
  }
  
  if (options.author) {
    embed.setAuthor({
      name: options.author.name || '',
      iconURL: options.author.iconURL,
      url: options.author.url
    });
  }
  
  if (options.timestamp) {
    embed.setTimestamp(options.timestamp === true ? undefined : options.timestamp);
  }
  
  return embed;
}

/**
 * Create a success embed with green color
 * @param {String} title - The title of the embed
 * @param {String} description - The description of the embed
 * @param {Object} options - Additional options for the embed
 * @returns {EmbedBuilder} - The created embed
 */
function createSuccessEmbed(title, description, options = {}) {
  return createEmbed({
    title,
    description,
    color: 0x57F287, // Discord green
    ...options
  });
}

/**
 * Create an error embed with red color
 * @param {String} title - The title of the embed
 * @param {String} description - The description of the embed
 * @param {Object} options - Additional options for the embed
 * @returns {EmbedBuilder} - The created embed
 */
function createErrorEmbed(title, description, options = {}) {
  return createEmbed({
    title,
    description,
    color: 0xED4245, // Discord red
    ...options
  });
}

/**
 * Create a warning embed with yellow color
 * @param {String} title - The title of the embed
 * @param {String} description - The description of the embed
 * @param {Object} options - Additional options for the embed
 * @returns {EmbedBuilder} - The created embed
 */
function createWarningEmbed(title, description, options = {}) {
  return createEmbed({
    title,
    description,
    color: 0xFEE75C, // Discord yellow
    ...options
  });
}

/**
 * Create an info embed with blue color
 * @param {String} title - The title of the embed
 * @param {String} description - The description of the embed
 * @param {Object} options - Additional options for the embed
 * @returns {EmbedBuilder} - The created embed
 */
function createInfoEmbed(title, description, options = {}) {
  return createEmbed({
    title,
    description,
    color: 0x5865F2, // Discord blurple
    ...options
  });
}

module.exports = {
  createEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createInfoEmbed
};