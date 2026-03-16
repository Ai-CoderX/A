const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage } = require('./store');
const config = require('../config');

const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    try {
        if (!conn || !mek || !jid) return;
        
        const messageContent = mek.message?.conversation || 
                              mek.message?.extendedTextMessage?.text || 
                              'Unknown content';
        
        const mentionedJid = [];
        if (isGroup && mek.key?.participant) {
            mentionedJid.push(mek.key.participant);
        } else if (!isGroup && mek.key?.remoteJid) {
            mentionedJid.push(mek.key.remoteJid);
        }
        
        // Send info card
        if (deleteInfo) {
            await conn.sendMessage(
                jid,
                {
                    text: deleteInfo,
                    contextInfo: {
                        mentionedJid: mentionedJid.length ? mentionedJid : undefined,
                    },
                },
                { quoted: mek }
            ).catch(e => console.error('Error sending delete info:', e));
        }
        
        // Send content
        if (messageContent) {
            await conn.sendMessage(
                jid,
                {
                    text: messageContent,
                    contextInfo: {
                        mentionedJid: mentionedJid.length ? mentionedJid : undefined,
                    },
                },
                { quoted: mek }
            ).catch(e => console.error('Error sending content:', e));
        }
    } catch (error) {
        console.error('Error in DeletedText:', error);
    }
};

const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
    try {
        if (!conn || !mek || !jid || !mek.message) return;
        
        const antideletedmek = structuredClone(mek.message);
        if (!antideletedmek) return;
        
        const messageType = Object.keys(antideletedmek)[0];
        if (!messageType) return;
        
        // Send info card
        if (deleteInfo) {
            await conn.sendMessage(
                jid,
                {
                    text: deleteInfo,
                    contextInfo: {
                        mentionedJid: mek.sender ? [mek.sender] : undefined,
                    },
                },
                { quoted: mek }
            ).catch(e => console.error('Error sending delete info:', e));
        }
        
        // Send media
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
        if (mediaTypes.includes(messageType)) {
            await conn.relayMessage(jid, antideletedmek, {}).catch(e => console.error('Error relaying media:', e));
        }
    } catch (error) {
        console.error('Error in DeletedMedia:', error);
    }
};

const AntiDelete = async (conn, updates) => {
    try {
        // ⚡ INSTANT check - no I/O, no database
        if (!conn || !updates || !Array.isArray(updates)) return;
        if (!config.ANTI_DELETE || config.ANTI_DELETE !== "true") return;
        
        for (const update of updates) {
            try {
                if (!update?.key?.id) continue;
                if (!update.update || update.update.message !== null) continue;
                
                const store = await loadMessage(update.key.id).catch(() => null);
                if (!store?.message || !store?.jid) continue;
                
                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                
                // Determine destination - uses config (in memory)
                let jid;
                if (config.ANTI_DELETE_PATH === "inbox") {
                    jid = conn.user?.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;
                    if (!jid) continue;
                } else {
                    jid = isGroup ? store.jid : (update.key?.remoteJid || store.jid);
                    if (!jid) continue;
                }
                
                // Get sender
                let senderNumber = 'Unknown';
                if (isGroup && mek.key?.participant) {
                    senderNumber = mek.key.participant.split('@')[0];
                } else if (!isGroup && mek.key?.remoteJid) {
                    senderNumber = mek.key.remoteJid.split('@')[0];
                }
                
                const deleteInfo = `*⚠️ Deleted Message Alert 🚨*
*╭────⬡ KHAN-MD ⬡────*
*├▢ SENDER :* @${senderNumber}
*├▢ ACTION :* Deleted a Message
*╰▢ MESSAGE :* Content Below 🔽`;
                
                // Check message type
                const hasText = mek.message?.conversation || mek.message?.extendedTextMessage?.text;
                
                if (hasText) {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                } else {
                    const messageKeys = Object.keys(mek.message || {});
                    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
                    const isMedia = messageKeys.some(key => mediaTypes.includes(key));
                    
                    if (isMedia) {
                        await DeletedMedia(conn, mek, jid, deleteInfo);
                    }
                }
            } catch (error) {
                console.error('Error processing update:', error);
                continue;
            }
        }
    } catch (error) {
        console.error('Error in AntiDelete:', error);
    }
};

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
};
