// Credits JawadTechX - KHAN-MD 💜

const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('../config');
const { lidToPhone } = require('./functions'); // Import lidToPhone from function.js

const GroupEvents = async (conn, update) => {
    try {
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants.length;
        const timestamp = new Date().toLocaleString();

        for (const user of participants) {
            const lid = user.id || user; // Get the lid properly
            const userPN = await lidToPhone(conn, lid); // Convert lid to phone number
            const userName = userPN; // Use the phone number as username

            if (update.action === "add" && config.WELCOME === "true") {
                // Replace placeholders in welcome message
                let welcomeMsg = config.WELCOME_MESSAGE
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, metadata.subject)
                    .replace(/@desc/g, desc)
                    .replace(/@count/g, groupMembersCount)
                    .replace(/@bot/g, config.BOT_NAME)
                    .replace(/@time/g, timestamp);

                await conn.sendMessage(update.id, {
                    text: welcomeMsg,
                    mentions: [lid]
                });

            } else if (update.action === "remove" && config.GOODBYE === "true") {
                // Replace placeholders in goodbye message
                let goodbyeMsg = config.GOODBYE_MESSAGE
                    .replace(/@user/g, `@${userName}`)
                    .replace(/@group/g, metadata.subject)
                    .replace(/@desc/g, desc)
                    .replace(/@count/g, groupMembersCount)
                    .replace(/@bot/g, config.BOT_NAME)
                    .replace(/@time/g, timestamp);

                await conn.sendMessage(update.id, {
                    text: goodbyeMsg,
                    mentions: [lid]
                });

            } else if (update.action === "demote" && config.ADMIN_ACTION === "true") {
                const authorLid = update.author;
                const authorPN = await lidToPhone(conn, authorLid);
                const authorName = authorPN;
                
                await conn.sendMessage(update.id, {
                    text: `@${authorName} demoted @${userName}`,
                    mentions: [authorLid, lid]
                });

            } else if (update.action === "promote" && config.ADMIN_ACTION === "true") {
                const authorLid = update.author;
                const authorPN = await lidToPhone(conn, authorLid);
                const authorName = authorPN;
                
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
