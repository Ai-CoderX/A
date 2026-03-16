// lib/groupevents.js - KHAN-MD Group Events Handler (TEXT ONLY)
const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');

// Clean phone number function
function cleanPN(pn) {
    if (!pn) return '';
    return pn.split(":")[0];
}

// Convert LID → Phone Number (if mapping exists)
async function lidToPhone(conn, lid) {
    try {
        if (!lid) return '';
        
        // Check if it's actually a LID
        if (lid.includes('@lid')) {
            const pn = await conn.signalRepository.lidMapping.getPNForLID(lid);
            if (pn) {
                return cleanPN(pn);
            }
        }
        return lid.split("@")[0];
    } catch (error) {
        // If error, return the part before @
        return lid ? lid.split("@")[0] : '';
    }
}

// MAIN HANDLER - TEXT ONLY, NO IMAGES
const GroupEvents = async (conn, update) => {
    try {
        // ===== NULL CHECKS FIRST =====
        if (!conn || !update) return;
        if (!update.id || !update.action || !update.participants) return;
        
        // Check if it's a group
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        // Get group metadata with error handling
        const metadata = await conn.groupMetadata(update.id).catch(e => null);
        if (!metadata) return;

        // Get group info with defaults
        const groupName = metadata.subject || 'Group';
        const groupDesc = metadata.desc || 'No description';
        const groupSize = metadata.participants?.length || 0;
        const timestamp = new Date().toLocaleString('en-GB', {
            timeZone: config.TIMEZONE || 'Asia/Karachi',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        // Process each participant
        for (const participant of update.participants) {
            if (!participant) continue;
            
            const lid = participant; // This is the LID
            const userPN = await lidToPhone(conn, lid).catch(() => lid.split('@')[0] || 'User');
            const userName = userPN;

            // ===== WELCOME HANDLER - TEXT ONLY (enabled via WELCOME config) =====
            if (update.action === 'add' && config.WELCOME === "true") {
                // Use custom welcome message from config or default
                let welcomeMsg = config.WELCOME_MSG || 
                    `╭─〔 *🤖 ${config.BOT_NAME}* 〕\n` +
                    `├─▸ *Welcome @user to @group* 🎉\n` +
                    `├─ *You are member #@count*\n` +
                    `├─ *Time:* @time\n` +
                    `├─ *Group:* @group\n` +
                    `╰─➤ *Please read group description*`;

                // Replace placeholders
                welcomeMsg = welcomeMsg
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, groupName)
                    .replace(/@desc/g, groupDesc)
                    .replace(/@count/g, groupSize)
                    .replace(/@bot/g, config.BOT_NAME)
                    .replace(/@time/g, timestamp);

                // Send TEXT ONLY message
                await conn.sendMessage(update.id, {
                    text: welcomeMsg,
                    mentions: [lid]  // Mention using LID
                }).catch(e => console.error('Welcome message error:', e));
            }

            // ===== GOODBYE HANDLER - TEXT ONLY (enabled via WELCOME config) =====
            if (update.action === 'remove' && config.WELCOME === "true") {
                // Use custom goodbye message from config or default
                let goodbyeMsg = config.GOODBYE_MSG || 
                    `╭─〔 *🤖 ${config.BOT_NAME}* 〕\n` +
                    `├─▸ *Goodbye @user* 👋\n` +
                    `├─ *Left at:* @time\n` +
                    `├─ *Members remaining:* @count\n` +
                    `├─ *Group:* @group\n` +
                    `╰─➤ *We'll miss you!*`;

                // Replace placeholders
                goodbyeMsg = goodbyeMsg
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, groupName)
                    .replace(/@desc/g, groupDesc)
                    .replace(/@count/g, groupSize)
                    .replace(/@bot/g, config.BOT_NAME)
                    .replace(/@time/g, timestamp);

                // Send TEXT ONLY message
                await conn.sendMessage(update.id, {
                    text: goodbyeMsg,
                    mentions: [lid]  // Mention using LID
                }).catch(e => console.error('Goodbye message error:', e));
            }
            
            // Note: ADMIN_EVENTS (promote/demote) are NOT included as per your request
        }
    } catch (error) {
        console.error('❌ GroupEvents Error:', error);
    }
};

module.exports = GroupEvents;
