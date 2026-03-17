// Credits JawadTechX - KHAN-MD 💜

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');
const { lidToPhone } = require('./functions'); // Import lidToPhone from function.js

const GroupEvents = async (conn, update) => {
    try {
        // Null check for update and update.id
        if (!update || !update.id) return;
        
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        // Null check for update.participants
        if (!update.participants || !Array.isArray(update.participants) || update.participants.length === 0) return;

        const metadata = await conn.groupMetadata(update.id);
        // Null check for metadata
        if (!metadata) return;

        const participants = update.participants;
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants ? metadata.participants.length : 0;
        const timestamp = new Date().toLocaleString();

        for (const user of participants) {
            // Null check for user
            if (!user) continue;
            
            const lid = user.id || user; // Get the lid properly
            // Null check for lid
            if (!lid) continue;
            
            const userPN = await lidToPhone(conn, lid); // Convert lid to phone number
            const userName = userPN || lid.split('@')[0] || "unknown"; // Fallback if userPN is null

            if (update.action === "add" && config.WELCOME === "true") {
                // Null check for welcome message
                if (!config.WELCOME_MESSAGE) continue;
                
                // Replace placeholders in welcome message
                let welcomeMsg = config.WELCOME_MESSAGE
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, metadata.subject || "Group")
                    .replace(/@desc/g, desc)
                    .replace(/@count/g, groupMembersCount)
                    .replace(/@bot/g, config.BOT_NAME || "Bot")
                    .replace(/@time/g, timestamp);

                await conn.sendMessage(update.id, {
                    text: welcomeMsg,
                    mentions: [lid]
                });

            } else if (update.action === "remove" && config.GOODBYE === "true") {
                // Null check for goodbye message
                if (!config.GOODBYE_MESSAGE) continue;
                
                // Replace placeholders in goodbye message
                let goodbyeMsg = config.GOODBYE_MESSAGE
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, metadata.subject || "Group")
                    .replace(/@desc/g, desc)
                    .replace(/@count/g, groupMembersCount)
                    .replace(/@bot/g, config.BOT_NAME || "Bot")
                    .replace(/@time/g, timestamp);

                await conn.sendMessage(update.id, {
                    text: goodbyeMsg,
                    mentions: [lid]
                });

            } else if (update.action === "demote" && config.ADMIN_ACTION === "true") {
                // Null check for author
                if (!update.author) continue;
                
                const authorLid = update.author;
                const authorPN = await lidToPhone(conn, authorLid);
                const authorName = authorPN || authorLid.split('@')[0] || "unknown";
                
                await conn.sendMessage(update.id, {
                    text: `@${authorName} demoted @${userName}`,
                    mentions: [authorLid, lid]
                });

            } else if (update.action === "promote" && config.ADMIN_ACTION === "true") {
                // Null check for author
                if (!update.author) continue;
                
                const authorLid = update.author;
                const authorPN = await lidToPhone(conn, authorLid);
                const authorName = authorPN || authorLid.split('@')[0] || "unknown";
                
                await conn.sendMessage(update.id, {
                    text: `@${authorName} promoted @${userName}`,
                    mentions: [authorLid, lid]
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;
