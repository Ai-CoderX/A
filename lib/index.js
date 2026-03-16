// lib/index.js - KHAN-MD 

const { 
    saveContact,
    loadMessage,
    getName,
    getChatSummary,
    saveGroupMetadata,
    getGroupMetadata,
    saveMessageCount,
    getInactiveGroupMembers,
    getGroupMembersMessageCount,
    saveMessage
} = require('./store');

// Import other functions from lib/functions.js
const {
    getBuffer,
    getGroupAdmins,
    getRandom,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson,
    lidToPhone,
    cleanPN
} = require('./functions');

// Import msg functions from lib/msg.js
const { sms, downloadMediaMessage } = require('./msg');

// Import antidelete functions from lib/antidelete.js
const { 
    DeletedText,
    DeletedMedia,
    AntiDelete 
} = require('./antidel');

// Import warning functions from lib/warning.js (UPDATED - uses JSON file)
const { 
    getLinkWarnings,
    saveLinkWarnings,
    getLinkWarningCount,
    addLinkWarning,
    removeLinkWarning,
    getWarning,
    addWarning,
    clearWarning
} = require('./warning');

// Import anti-edit functions from lib/antiedit.js
const { 
    AntiEdit 
} = require('./antiedit');

// Export everything
module.exports = {
    // Store functions
    saveContact,
    loadMessage,
    getName,
    getChatSummary,
    saveGroupMetadata,
    getGroupMetadata,
    saveMessageCount,
    getInactiveGroupMembers,
    getGroupMembersMessageCount,
    saveMessage,
    
    // Functions
    getBuffer,
    getGroupAdmins,
    getRandom,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson,
    lidToPhone,
    cleanPN,
    
    // Msg functions
    sms,
    downloadMediaMessage,
    
    // Antidelete functions
    DeletedText,
    DeletedMedia,
    AntiDelete,
    
    // Link warning functions (from JSON file)
    getLinkWarnings,
    saveLinkWarnings,
    getLinkWarningCount,
    addLinkWarning,
    removeLinkWarning,
    getWarning,
    addWarning,
    clearWarning,
    
    // Anti-edit functions
    AntiEdit
};
