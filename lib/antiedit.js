// KHAN XMD 

const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage } = require('./store');
const config = require('../config');

// Function to get message content from various message types
const getMessageContent = (msg) => {
    if (!msg) return '';
    
    // Handle protocol message editedMessage structure
    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;
    
    // If msg has .message property (like stored messages)
    if (msg.message) {
        if (msg.message.conversation) return msg.message.conversation;
        if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
        if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption;
        if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption;
    }
    
    return '';
};

const AntiEdit = async (conn, msg) => {
    if (!msg.message?.protocolMessage?.editedMessage) return;

    // Check if ANTI_EDIT is enabled (true/false)
    if (config.ANTI_EDIT !== "true") return;

    const protocolMsg = msg.message.protocolMessage;
    const messageId = protocolMsg.key.id;
    
    const originalMsg = await loadMessage(messageId);
    
    // Check if originalMsg exists and has message property
    if (!originalMsg || !originalMsg.message) return;

    const originalMessageObj = originalMsg.message;
    
    // Skip if message was sent by bot
    if (originalMessageObj.key?.fromMe) return;

    // Skip if bot is editing
    const editorJid = msg.key.participant || msg.key.remoteJid;
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    if (editorJid === botNumber) return;

    // Get text content
    const originalText = getMessageContent(originalMessageObj);
    
    // Get edited text directly from protocolMsg.editedMessage
    // protocolMsg.editedMessage is already the message content, not wrapped in .message
    const editedText = getMessageContent(protocolMsg.editedMessage);
    
    if (!originalText && !editedText) return;

    // Get sender correctly
    const sender = originalMessageObj.key?.participant || originalMessageObj.key?.remoteJid;
    if (!sender) return;
    
    const senderNumber = sender.split('@')[0];
    
    const isGroup = isJidGroup(originalMsg.jid);

    // Determine target JID and create alert info
    let alertInfo, jid;
    
    if (isGroup) {
        // For group messages
        try {
            alertInfo = `*╭────⬡ KHAN-MD ⬡────*
*├▢ SENDER :* @${senderNumber}
*├▢ ACTION :* Edited a Message*`;
            jid = config.ANTIEDIT_PATH === "inbox" 
                ? conn.user.id.split(':')[0] + "@s.whatsapp.net"  // Send to bot's inbox
                : originalMsg.jid;                                 // Send to same group
        } catch (e) {
            console.error('Error processing group edit:', e);
            return;
        }
    } else {
        // For private messages
        alertInfo = `*╭────⬡ KHAN-MD ⬡────*
*├▢ SENDER :* @${senderNumber}
*├▢ ACTION :* Edited a Message*`;
        jid = config.ANTIEDIT_PATH === "inbox" 
            ? conn.user.id.split(':')[0] + "@s.whatsapp.net"  // Send to bot's inbox
            : originalMsg.jid;                                 // Send to same private chat
    }

    const alertText = `*⚠️ Edited Message Alert 🚨*
${alertInfo}
*╰▢ MESSAGE :* Content Below 🔽

*╭─ ORIGINAL ─╮*

${originalText || '[Empty]'}

*╰─ EDITED TO ─╯*

${editedText || '[Empty]'}`;

    const mentionedJid = [sender];
    if (msg.key.participant && msg.key.participant !== sender) {
        mentionedJid.push(msg.key.participant);
    }

    await conn.sendMessage(jid, {
        text: alertText,
        contextInfo: { mentionedJid: mentionedJid.length ? mentionedJid : undefined }
    }, { quoted: originalMessageObj });

    console.log(`[✏️] Edit captured from ${senderNumber} -> Original: "${originalText}" | Edited to: "${editedText}" -> sent to ${jid === conn.user.id.split(':')[0] + "@s.whatsapp.net" ? 'inbox' : 'same chat'}`);
};

module.exports = { AntiEdit };
