// KHAN-XMD 

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
} = require('./functions');

// Import msg functions from lib/msg.js
const { sms, downloadMediaMessage } = require('./msg');

// Import antidelete functions from lib/antidelete.js
const { 
    DeletedText,
    DeletedMedia,
    AntiDelete 
} = require('./antidel');

// Import warning functions from lib/warning.js
const { 
    // Link warnings
    getLinkWarnings,
    saveLinkWarnings,
    getLinkWarningCount,
    addLinkWarning,
    removeLinkWarning,
    
    // Bad word warnings
    getBadWordWarnings,
    saveBadWordWarnings,
    getBadWordWarningCount,
    addBadWordWarning,
    removeBadWordWarning
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
    
    // Msg functions
    sms,
    downloadMediaMessage,
    
    // Antidelete functions
    DeletedText,
    DeletedMedia,
    AntiDelete,
    
    // Link warning functions
    getLinkWarnings,
    saveLinkWarnings,
    getLinkWarningCount,
    addLinkWarning,
    removeLinkWarning,
    
    // Bad word warning functions
    getBadWordWarnings,
    saveBadWordWarnings,
    getBadWordWarningCount,
    addBadWordWarning,
    removeBadWordWarning,
    
    // Anti-edit functions
    AntiEdit
};
