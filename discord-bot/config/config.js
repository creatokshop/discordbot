
require('dotenv').config();

module.exports = {
  token: process.env.TOKEN, // Token from environment variables
  clientId: '1372030799507095694', // Your Discord application client ID
  guildId: '1371976759775465565', // Your Discord server/guild ID
  mongoURI: process.env.MONGO_URI, // MongoDB connection string from environment
  
  // Channel IDs
  channels: {
    welcome: '1371989764567203910',
    rules: '1371989855768412220',
    announcements: '1371989901616091299',
    faq: '1372016216566403083',
    buyaccounts: '1372017497905299537',
    staffChannel: 'staff-channel-id',
    support: '1372023891731550268',
    ticketCategory: '1372023716392996944',
    supportCategory: '1372023630468223071',
    specialOffers: 'special-offers-channel-id',
    tiktokTips: '1372024696698175671',
    howItWorks: '1374781322589114418',
    general: '1372024612874879048',
    usInterest: '1375159549463367690',
    ukInterest: '1375159881748709376',
    euInterest: '1375159948069175326',
    orderCategory: '1371990834580553749',
    pricingdetails: '1372020764890501130',
    growthTips: '1372024779250597960',
    apkSetup: '1372024055376642180',
    website: '1379499559960445199',
    instagram: '1379503573674496090',
    telegram: '1379504606672978002',
    tutorials: '1372025376007786537',
    scamAlerts: '1372025493267812444',
    privacyProtection: '1372025629842608239'
  },

  
  // Role IDs
  roles: {
    usRegion: '1374529596032290867',
    ukRegion: '1374530360305647759', 
    euRegion: '1374530608570699817',
    supportTeam: 'support-team-role-id',
    staff: '1374530860522541087'
  },
  // Message IDs for reaction roles
  messages: {
    roleAssignment: 'role-assignment-message-id',
    verificationMessage: 'verification-message-id'
  },
};