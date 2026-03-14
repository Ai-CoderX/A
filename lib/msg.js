const config = require('../config');
const { proto, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const fs = require('fs');

// Helper function to check if string is URL
const isUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

const downloadMediaMessage = async (m, filename) => {
    try {
        if (m.type === 'viewOnceMessage') {
            m.type = m.msg.type;
        }
        if (m.type === 'imageMessage') {
            var nameJpg = filename ? filename + '.jpg' : 'undefined.jpg';
            const stream = await downloadContentFromMessage(m.msg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            fs.writeFileSync(nameJpg, buffer);
            return fs.readFileSync(nameJpg);
        } else if (m.type === 'videoMessage') {
            var nameMp4 = filename ? filename + '.mp4' : 'undefined.mp4';
            const stream = await downloadContentFromMessage(m.msg, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            fs.writeFileSync(nameMp4, buffer);
            return fs.readFileSync(nameMp4);
        } else if (m.type === 'audioMessage') {
            var nameMp3 = filename ? filename + '.mp3' : 'undefined.mp3';
            const stream = await downloadContentFromMessage(m.msg, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            fs.writeFileSync(nameMp3, buffer);
            return fs.readFileSync(nameMp3);
        } else if (m.type === 'stickerMessage') {
            var nameWebp = filename ? filename + '.webp' : 'undefined.webp';
            const stream = await downloadContentFromMessage(m.msg, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            fs.writeFileSync(nameWebp, buffer);
            return fs.readFileSync(nameWebp);
        } else if (m.type === 'documentMessage') {
            var ext = m.msg.fileName ? m.msg.fileName.split('.')[1].toLowerCase().replace('jpeg', 'jpg').replace('png', 'jpg').replace('m4a', 'mp3') : 'bin';
            var nameDoc = filename ? filename + '.' + ext : 'undefined.' + ext;
            const stream = await downloadContentFromMessage(m.msg, 'document');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            fs.writeFileSync(nameDoc, buffer);
            return fs.readFileSync(nameDoc);
        }
    } catch (error) {
        console.error('[DOWNLOAD MEDIA] Error:', error);
        return null;
    }
};

const sms = (conn, m, store) => {
    if (!m) return m;
    
    try {
        let M = proto.WebMessageInfo;
        
        // Process message key
        if (m.key) {
            m.id = m.key.id;
            m.isBot = m.id ? (m.id.startsWith('BAES') && m.id.length === 16) : false;
            m.isBaileys = m.id ? (m.id.startsWith('BAE5') && m.id.length === 16) : false;
            m.chat = m.key.remoteJid;
            m.fromMe = m.key.fromMe;
            m.isGroup = m.chat ? m.chat.endsWith('@g.us') : false;
            m.sender = m.fromMe ? (conn.user ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : '') : 
                       (m.isGroup ? m.key.participant : m.key.remoteJid);
        }
        
        // Process message content
        if (m.message) {
            m.mtype = getContentType(m.message);
            
            // Handle viewOnceMessage properly
            if (m.mtype === 'viewOnceMessage') {
                try {
                    if (m.message.viewOnceMessage && m.message.viewOnceMessage.message) {
                        m.message = m.message.viewOnceMessage.message;
                        m.mtype = getContentType(m.message);
                    }
                } catch (e) {
                    console.log('[VIEW ONCE] Error handling viewOnceMessage:', e.message);
                }
            }
            
            // Handle ephemeral messages
            if (m.mtype === 'ephemeralMessage') {
                try {
                    if (m.message.ephemeralMessage && m.message.ephemeralMessage.message) {
                        m.message = m.message.ephemeralMessage.message;
                        m.mtype = getContentType(m.message);
                    }
                } catch (e) {
                    console.log('[EPHEMERAL] Error handling ephemeralMessage:', e.message);
                }
            }
            
            // Get message content
            try {
                if (m.mtype === 'viewOnceMessage') {
                    m.msg = m.message[m.mtype]?.message ? 
                            m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : 
                            {};
                } else {
                    m.msg = m.message[m.mtype] || {};
                }
            } catch (e) {
                m.msg = {};
            }
            
            // Extract message body
            try {
                m.body = '';
                if (m.mtype === 'conversation' && m.message.conversation) {
                    m.body = m.message.conversation;
                } else if (m.mtype === 'imageMessage' && m.message.imageMessage && m.message.imageMessage.caption) {
                    m.body = m.message.imageMessage.caption;
                } else if (m.mtype === 'videoMessage' && m.message.videoMessage && m.message.videoMessage.caption) {
                    m.body = m.message.videoMessage.caption;
                } else if (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage && m.message.extendedTextMessage.text) {
                    m.body = m.message.extendedTextMessage.text;
                } else if (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage) {
                    m.body = m.message.buttonsResponseMessage.selectedButtonId || '';
                } else if (m.mtype === 'listResponseMessage' && m.message.listResponseMessage) {
                    m.body = m.message.listResponseMessage.singleSelectReply?.selectedRowId || '';
                } else if (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage) {
                    m.body = m.message.templateButtonReplyMessage.selectedId || '';
                } else if (m.mtype === 'messageContextInfo') {
                    m.body = m.message.buttonsResponseMessage?.selectedButtonId || 
                             m.message.listResponseMessage?.singleSelectReply?.selectedRowId || '';
                }
            } catch (e) {
                m.body = '';
            }
            
            // FIXED: Add null checks for contextInfo
            let quoted = null;
            if (m.msg && m.msg.contextInfo && m.msg.contextInfo.quotedMessage) {
                quoted = m.msg.contextInfo.quotedMessage;
                m.quoted = quoted;
            } else {
                m.quoted = null;
            }
            
            // Get mentioned JIDs
            m.mentionedJid = [];
            if (m.msg && m.msg.contextInfo && m.msg.contextInfo.mentionedJid) {
                m.mentionedJid = m.msg.contextInfo.mentionedJid;
            }
            
            // Process quoted message if it exists
            if (m.quoted) {
                try {
                    let type = getContentType(quoted);
                    m.quoted = quoted[type];
                    
                    if (!m.quoted) {
                        m.quoted = {};
                    }
                    
                    if (['productMessage'].includes(type) && m.quoted) {
                        type = getContentType(m.quoted);
                        m.quoted = m.quoted[type] || {};
                    }
                    
                    if (typeof m.quoted === 'string') {
                        m.quoted = { text: m.quoted };
                    }
                    
                    // Skip viewOnceMessageV2 messages
                    if (!quoted.viewOnceMessageV2) {
                        m.quoted.mtype = type;
                        m.quoted.id = (m.msg && m.msg.contextInfo) ? m.msg.contextInfo.stanzaId : '';
                        m.quoted.chat = (m.msg && m.msg.contextInfo) ? 
                                        (m.msg.contextInfo.remoteJid || m.chat) : m.chat;
                        m.quoted.isBot = m.quoted.id ? 
                                        (m.quoted.id.startsWith('BAES') && m.quoted.id.length === 16) : false;
                        m.quoted.isBaileys = m.quoted.id ? 
                                            (m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16) : false;
                        m.quoted.sender = (m.msg && m.msg.contextInfo) ? 
                                         conn.decodeJid(m.msg.contextInfo.participant) : '';
                        m.quoted.fromMe = m.quoted.sender ? 
                                         (m.quoted.sender === (conn.user && conn.user.id)) : false;
                        m.quoted.text = m.quoted.text || m.quoted.caption || 
                                        m.quoted.conversation || m.quoted.contentText || 
                                        m.quoted.selectedDisplayText || m.quoted.title || '';
                        m.quoted.mentionedJid = (m.msg && m.msg.contextInfo) ? 
                                               (m.msg.contextInfo.mentionedJid || []) : [];
                        
                        // Function to get quoted message object
                        m.getQuotedObj = m.getQuotedMessage = async () => {
                            if (!m.quoted.id || !store) return false;
                            try {
                                let q = await store.loadMessage(m.chat, m.quoted.id, conn);
                                return q ? sms(conn, q, store) : false;
                            } catch (e) {
                                console.log('[GET QUOTED] Error:', e.message);
                                return false;
                            }
                        };
                        
                        // Create fake message object for forwarding
                        m.quoted.fakeObj = M.fromObject({
                            key: {
                                remoteJid: m.quoted.chat,
                                fromMe: m.quoted.fromMe,
                                id: m.quoted.id
                            },
                            message: quoted,
                            ...(m.isGroup ? { participant: m.quoted.sender } : {})
                        });
                        
                        // Delete quoted message function
                        const key = {
                            remoteJid: m.chat,
                            fromMe: false,
                            id: m.quoted.id,
                            participant: m.quoted.sender
                        };
                        m.quoted.delete = async () => {
                            try {
                                await conn.sendMessage(m.chat, { delete: key });
                            } catch (e) {
                                console.log('[DELETE QUOTED] Error:', e.message);
                            }
                        };
                        
                        // Forward quoted message function
                        m.forwardMessage = (jid, forceForward = true, options = {}) => {
                            return conn.copyNForward(jid, m.quoted.fakeObj, forceForward, 
                                                    { contextInfo: { isForwarded: false } }, options);
                        };
                        
                        // Download quoted media function
                        m.quoted.download = () => downloadMediaMessage(m.quoted);
                    }
                } catch (e) {
                    console.log('[QUOTED PROCESS] Error:', e.message);
                    m.quoted = null;
                }
            }
        }
        
        // Download function for main message
        if (m.msg && m.msg.url) {
            m.download = () => downloadMediaMessage(m.msg);
        }
        
        // Get message text
        m.text = '';
        if (m.msg) {
            m.text = m.msg.text || m.msg.caption || '';
        }
        if (!m.text && m.message && m.message.conversation) {
            m.text = m.message.conversation;
        }
        if (!m.text && m.msg) {
            m.text = m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || '';
        }
        
        // Message functions
        m.copy = () => sms(conn, M.fromObject(M.toObject(m)), store);
        
        m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => {
            return conn.copyNForward(jid, m, forceForward, options);
        };
        
        m.sticker = (stik, id = m.chat, option = { mentions: [m.sender] }) => {
            return conn.sendMessage(id, { 
                sticker: stik, 
                contextInfo: { mentionedJid: option.mentions || [] } 
            }, { quoted: m });
        };
        
        m.replyimg = (img, teks, id = m.chat, option = { mentions: [m.sender] }) => {
            return conn.sendMessage(id, { 
                image: img, 
                caption: teks, 
                contextInfo: { mentionedJid: option.mentions || [] } 
            }, { quoted: m });
        };
        
        m.imgurl = (img, teks, id = m.chat, option = { mentions: [m.sender] }) => {
            return conn.sendMessage(id, { 
                image: { url: img }, 
                caption: teks, 
                contextInfo: { mentionedJid: option.mentions || [] } 
            }, { quoted: m });
        };
        
        // Reply function
        m.reply = async (content, opt = { packname: "KHAN-MD", author: "JawadTech" }, type = "text") => {
            try {
                switch (type.toLowerCase()) {
                    case "text":
                        return await conn.sendMessage(m.chat, { text: content }, { quoted: m });
                        
                    case "image":
                        if (Buffer.isBuffer(content)) {
                            return await conn.sendMessage(m.chat, { image: content, ...opt }, { quoted: m });
                        } else if (isUrl(content)) {
                            return await conn.sendMessage(m.chat, { image: { url: content }, ...opt }, { quoted: m });
                        }
                        break;
                        
                    case "video":
                        if (Buffer.isBuffer(content)) {
                            return await conn.sendMessage(m.chat, { video: content, ...opt }, { quoted: m });
                        } else if (isUrl(content)) {
                            return await conn.sendMessage(m.chat, { video: { url: content }, ...opt }, { quoted: m });
                        }
                        break;
                        
                    case "audio":
                        if (Buffer.isBuffer(content)) {
                            return await conn.sendMessage(m.chat, { audio: content, ...opt }, { quoted: m });
                        } else if (isUrl(content)) {
                            return await conn.sendMessage(m.chat, { audio: { url: content }, ...opt }, { quoted: m });
                        }
                        break;
                        
                    default:
                        return await conn.sendMessage(m.chat, { text: content }, { quoted: m });
                }
            } catch (e) {
                console.log('[REPLY] Error:', e.message);
                return null;
            }
        };
        
        // Send document function
        m.senddoc = (doc, type, id = m.chat, option = { 
            mentions: [m.sender], 
            filename: config.OWNER_NAME, 
            mimetype: type 
        }) => {
            return conn.sendMessage(id, { 
                document: doc, 
                mimetype: option.mimetype, 
                fileName: option.filename,
                contextInfo: { mentionedJid: option.mentions || [] }
            }, { quoted: m });
        };
        
        // Send contact function
        m.sendcontact = (name, info, number) => {
            var vcard = 'BEGIN:VCARD\n' + 
                       'VERSION:3.0\n' + 
                       'FN:' + name + '\n' + 
                       'ORG:' + info + ';\n' + 
                       'TEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\n' + 
                       'END:VCARD';
            return conn.sendMessage(m.chat, { 
                contacts: { 
                    displayName: name, 
                    contacts: [{ vcard }] 
                } 
            }, { quoted: m });
        };
        
        // React function
        m.react = (emoji) => {
            return conn.sendMessage(m.chat, { 
                react: { 
                    text: emoji, 
                    key: m.key 
                } 
            });
        };
        
        return m;
        
    } catch (error) {
        console.error('[SMS] Critical error in sms function:', error);
        return m || {};
    }
};

module.exports = { sms, downloadMediaMessage };
