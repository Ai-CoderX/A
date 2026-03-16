// lib/groupevents.js - KHAN-MD Group Events Handler
const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');
const { lidToPhone } = require('./functions');

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

            // ===== WELCOME HANDLER - Only if enabled =====
            if (update.action === 'add' && config.WELCOME === "true") {
                let welcomeMsg = config.WELCOME_MSG || 
                    `╭─〔 *🤖 ${config.BOT_NAME}* 〕\n` +
                    `├─▸ *Welcome @user to @group* 🎉\n` +
                    `├─ *You are member #@count*\n` +
                    `├─ *Time:* @time\n` +
                    `├─ *Group:* @group\n` +
                    `╰─➤ *Please read group description*`;

                welcomeMsg = welcomeMsg
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, groupName)
                    .replace(/@desc/g, groupDesc)
                    .replace(/@count/g, groupSize)
                    .replace(/@bot/g, config.BOT_NAME)
                    .replace(/@time/g, timestamp);

                await conn.sendMessage(update.id, {
                    text: welcomeMsg,
                    mentions: [lid]  // Mention using LID
                }).catch(e => console.error('Welcome message error:', e));
            }

            // ===== GOODBYE HANDLER - Only if enabled =====
            if (update.action === 'remove' && config.GOODBYE === "true") {
                let goodbyeMsg = config.GOODBYE_MSG || 
                    `╭─〔 *🤖 ${config.BOT_NAME}* 〕\n` +
                    `├─▸ *Goodbye @user* 👋\n` +
                    `├─ *Left at:* @time\n` +
                    `├─ *Members remaining:* @count\n` +
                    `├─ *Group:* @group\n` +
                    `╰─➤ *We'll miss you!*`;

                goodbyeMsg = goodbyeMsg
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, groupName)
                    .replace(/@desc/g, groupDesc)
                    .replace(/@count/g, groupSize)
                    .replace(/@bot/g, config.BOT_NAME)
                    .replace(/@time/g, timestamp);

                await conn.sendMessage(update.id, {
                    text: goodbyeMsg,
                    mentions: [lid]  // Mention using LID
                }).catch(e => console.error('Goodbye message error:', e));
            }
        }
    } catch (error) {
        console.error('❌ GroupEvents Error:', error);
    }
};

module.exports = GroupEvents;
