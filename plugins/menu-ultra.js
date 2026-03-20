// JawadTech - KHANX-MD

const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Helper function for small caps text
const toSmallCaps = (text) => {
    if (!text || typeof text !== 'string') return '';
    const smallCapsMap = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ',
        'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ',
        's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
        'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ',
        'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ',
        'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
    };
    return text.split('').map(char => smallCapsMap[char] || char).join('');
};

// Format category with your exact styles
const formatCategory = (category, cmds) => {
    const validCmds = cmds.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
    if (validCmds.length === 0) return '';
    
    let title = `\n\`『 ${category.toUpperCase()} 』\`\n╭───────────────────⊷\n`;
    let body = validCmds.map(cmd => {
        const commandName = cmd.pattern || '';
        return `*┋ ⬡ ${toSmallCaps(commandName)}*`;
    }).join('\n');
    let footer = `\n╰───────────────────⊷`;
    return `${title}${body}${footer}`;
};

// Format menu options with same font style as category
const formatMenuOptions = (categories) => {
    let menuOptions = '';
    let optionNumber = 1;
    
    categories.forEach(cat => {
        const displayName = toSmallCaps(cat.charAt(0).toUpperCase() + cat.slice(1));
        const menuText = toSmallCaps(' Menu');
        menuOptions += `*┋ ⬡ ${optionNumber} ${displayName}${menuText}*\n`;
        optionNumber++;
    });
    
    return menuOptions;
};

const commonContextInfo = (sender) => ({
    mentionedJid: [sender],
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363354023106228@newsletter',
        newsletterName: config.BOT_NAME,
        serverMessageId: 143
    }
});

// Function to validate media URL and determine type
const getMediaType = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    const urlLower = url.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (imageExtensions.some(ext => urlLower.endsWith(ext))) return 'image';
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.gif'];
    if (videoExtensions.some(ext => urlLower.endsWith(ext))) return 'video';
    return null;
};

// Get all categories and organize them
const getCategorizedCommands = () => {
    let totalCommands = Object.keys(commands).length;
    const categories = [...new Set(Object.values(commands).map(c => c.category))].filter(cat => 
        cat && cat.trim() !== '' && cat !== 'undefined'
    );
    const categorized = {};
    categories.forEach(cat => {
        const categoryCommands = Object.values(commands).filter(c => c.category === cat);
        const validCommands = categoryCommands.filter(cmd => cmd.pattern && cmd.pattern.trim() !== '');
        if (validCommands.length > 0) categorized[cat] = validCommands;
    });
    return { categorized, totalCommands };
};

cmd({
    pattern: "menu",
    alias: ["m", "help"],
    desc: "Show all bot commands in selection menu",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, pushname, reply }) => {
    try {
        await conn.sendPresenceUpdate('composing', from);
        
        const { categorized, totalCommands } = getCategorizedCommands();
        const availableCategories = Object.keys(categorized);
        const menuOptions = formatMenuOptions(availableCategories);

        const caption = `*╭┈───〔 ${config.BOT_NAME} 〕┈───⊷*
*├▢ 🇵🇸 Owner:* ${config.OWNER_NAME}
*├▢ 🪄 Prefix:* ${config.PREFIX}
*├▢ 🎐 Version:* ${config.VERSION}
*├▢ ☁️ Platform:* Heroku
*├▢ 📜 Plugins:* ${totalCommands}
*├▢ ⏰ Runtime:* ${runtime(process.uptime())}
*╰───────────────────⊷*
*╭───⬡ SELECT MENU ⬡───*
${menuOptions}*╰───────────────────⊷*

> *ʀᴇᴘʟʏ ᴡɪᴛʜ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴛᴏ sᴇʟᴇᴄᴛ ᴍᴇɴᴜ (1-${availableCategories.length})*`;

        let mainMenuMedia;
        const localImagePath = path.join(__dirname, '../lib/khanmd.jpg');
        const mediaType = getMediaType(config.BOT_MEDIA_URL);
        
        if (mediaType === 'image' || mediaType === 'video') {
            try {
                await axios.head(config.BOT_MEDIA_URL, { timeout: 3000 });
                mainMenuMedia = { [mediaType]: { url: config.BOT_MEDIA_URL } };
            } catch (serverError) {
                mainMenuMedia = { image: { url: localImagePath } };
            }
        } else {
            mainMenuMedia = { image: { url: localImagePath } };
        }

        const sentMsg = await conn.sendMessage(from, {
            ...mainMenuMedia,
            caption: caption,
            contextInfo: commonContextInfo(sender)
        }, { quoted: mek });

        const messageID = sentMsg.key.id;
        
        // Create listener function
        const menuListener = async (msgData) => {
            const receivedMsg = msgData.messages[0];
            if (!receivedMsg.message) return;

            const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
            const senderID = receivedMsg.key.remoteJid;
            const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

            if (isReplyToBot) {
                // Close event immediately
                conn.ev.off("messages.upsert", menuListener);
                
                await conn.sendMessage(senderID, { react: { text: '⬇️', key: receivedMsg.key } });

                const selectedNumber = parseInt(receivedText);
                if (selectedNumber >= 1 && selectedNumber <= availableCategories.length) {
                    const selectedCategory = availableCategories[selectedNumber - 1];
                    const categoryCommands = categorized[selectedCategory];
                    const displayName = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
                    
                    const categorySection = formatCategory(selectedCategory, categoryCommands);
                    
                    let categoryMenu = `*╭┈───〔 ${displayName} Menu 〕┈───⊷*\n`;
                    categoryMenu += `*├▢ 📜 Category:* ${selectedCategory}\n`;
                    categoryMenu += `*├▢ 🔢 Total Commands:* ${categoryCommands.length}\n`;
                    categoryMenu += `*╰───────────────────⊷*`;
                    categoryMenu += `${categorySection}\n\n`;
                    categoryMenu += `> *ᴜsᴇ ${config.PREFIX}ᴍᴇɴᴜ ᴛᴏ sᴇᴇ ᴀʟʟ ᴍᴇɴᴜs ᴀɢᴀɪɴ*`;

                    let categoryMedia;
                    const categoryMediaType = getMediaType(config.BOT_MEDIA_URL);
                    
                    if (categoryMediaType === 'image' || categoryMediaType === 'video') {
                        try {
                            await axios.head(config.BOT_MEDIA_URL, { timeout: 3000 });
                            categoryMedia = { [categoryMediaType]: { url: config.BOT_MEDIA_URL } };
                        } catch (serverError) {
                            categoryMedia = { image: { url: localImagePath } };
                        }
                    } else {
                        categoryMedia = { image: { url: localImagePath } };
                    }

                    await conn.sendMessage(senderID, {
                        ...categoryMedia,
                        caption: categoryMenu,
                        contextInfo: commonContextInfo(receivedMsg.key.participant || receivedMsg.key.remoteJid)
                    }, { quoted: receivedMsg });
                } else {
                    await conn.sendMessage(senderID, {
                        text: `❌ *Invalid selection! Please reply with a valid number (1-${availableCategories.length}).*`,
                        contextInfo: commonContextInfo(receivedMsg.key.participant || receivedMsg.key.remoteJid)
                    }, { quoted: receivedMsg });
                }
            }
        };
        
        // Add listener
        conn.ev.on("messages.upsert", menuListener);
        
        // Auto cleanup after 15 seconds if no selection
        setTimeout(() => {
            conn.ev.off("messages.upsert", menuListener);
            console.log('🧹 Menu listener cleaned up (timeout)');
        }, 15000);

    } catch (e) {
        console.error(e);
        reply(`❌ Error:\n${e}`);
    }
});
