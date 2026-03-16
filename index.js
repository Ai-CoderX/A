// KHAN-MD - UNSTOPPABLE VERSION
const crypto = require('crypto');
const config = require('./config');
const axios = require("axios");
const zlib = require('zlib');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  isJidGroup,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");
const { 
    sms, 
    downloadMediaMessage, 
    AntiDelete, 
    AntiEdit,
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
    getBuffer,
    getGroupAdmins,
    getRandom,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson,
    getLinkWarnings,
    saveLinkWarnings,
    getLinkWarningCount,
    addLinkWarning,
    removeLinkWarning,
    getWarning,
    addWarning,
    clearWarning
} = require('./lib');        

// Helper function for rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Increase event emitter limit
require('events').EventEmitter.defaultMaxListeners = 500;

const fsSync = require("fs");
const fs = require("fs").promises;
const ff = require("fluent-ffmpeg");
const P = require("pino");
const qrcode = require("qrcode-terminal");
const StickersTypes = require("wa-sticker-formatter");
const util = require("util");
const FileType = require("file-type");
const { fromBuffer } = require("file-type");
const bodyparser = require("body-parser");
const os = require("os");
const Crypto = require("crypto");
const path = require("path");
const readline = require("readline");
const { File } = require('megajs');

const ownerNumber = ['923427582273']

// Session directory paths
const sessionDir = path.join(__dirname, 'sessions');
const credsPath = path.join(sessionDir, 'creds.json');

// Create session directory if it doesn't exist
if (!fsSync.existsSync(sessionDir)) {
    fsSync.mkdirSync(sessionDir, { recursive: true });
}

// Temp directory management (DO NOT MODIFY)
const tempDir = path.join(os.tmpdir(), "cache-temp");
if (!fsSync.existsSync(tempDir)) {
  fsSync.mkdirSync(tempDir);
}

const clearTempDir = () => {
  fsSync.readdir(tempDir, (err, files) => {
    if (err) {
      console.error("[ ❌ ] Error clearing temp directory", { Error: err.message });
      return;
    }
    for (const file of files) {
      fsSync.unlink(path.join(tempDir, file), (err) => {
        if (err) console.error("[ ❌ ] Error deleting temp file", { File: file, Error: err.message });
      });
    }
  });
};
// Clear temp every 20 minutes
setInterval(clearTempDir, 20 * 60 * 1000);

// Clear session folder except creds.json (every 1 hour)
const clearSessionFolder = () => {
  console.log("[🧹] Cleaning session folder (keeping creds.json)...");
  
  if (fsSync.existsSync(sessionDir)) {
    fsSync.readdir(sessionDir, (err, files) => {
      if (err) {
        console.error("[ ❌ ] Error clearing session directory", { Error: err.message });
        return;
      }
      
      for (const file of files) {
        // Keep creds.json and creds file
        if (file === 'creds.json' || file === 'creds') {
          continue;
        }
        
        const filePath = path.join(sessionDir, file);
        fsSync.unlink(filePath, (err) => {
          if (err) console.error("[ ❌ ] Error deleting session file", { File: file, Error: err.message });
        });
      }
      console.log("[✅] Session folder cleaned (creds.json preserved)");
    });
  }
};

// Run session cleanup every 1 hour
setInterval(clearSessionFolder, 60 * 60 * 1000);

// lid to pn
async function lidToPhone(conn, lid) {
    try {
        if (!lid) return '';
        const pn = await conn.signalRepository.lidMapping.getPNForLID(lid);
        if (pn) {
            return cleanPN(pn);
        }
        return lid.split("@")[0];
    } catch (e) {
        return lid ? lid.split("@")[0] : '';
    }
}

// cleanPn
function cleanPN(pn) {
    if (!pn) return '';
    return pn.split(":")[0];
}

// Express server
const express = require("express");
const app = express();
const port = process.env.PORT || 7860;

app.use(express.static(path.join(__dirname, "lib")));
app.get("/", (req, res) => {
  res.redirect("/jawadtech.html");
});

app.listen(port, () =>
  console.log(
    `
╭──[ 🤖 WELCOME DEAR USER! ]─
│
│ If you enjoy using this bot,
│ please ⭐  Star it & 🍴  Fork it on GitHub!
│ your support keeps it growing! 💙 
╰─────────`
  )
);

//===================SESSION-AUTH (SUPPORTS BOTH MEGA AND BASE64)============================
async function loadSession() {
    try {
        if (!config.SESSION_ID) {
            console.log('No SESSION_ID provided - QR login will be generated');
            return null;
        }

        console.log('[⏳] CHECKING SESSION_ID FORMAT...');
        
        // ===== CHECK FOR MEGA FORMAT (DJ~) =====
        if (config.SESSION_ID.startsWith('DJ~')) {
            console.log('🔁 DETECTED MEGA.nz SESSION FORMAT');
            const megaFileId = config.SESSION_ID.replace("DJ~", "");
            
            try {
                const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
                
                const data = await new Promise((resolve, reject) => {
                    filer.download((err, data) => {
                        if (err) reject(err);
                        else resolve(data);
                    });
                });
                
                fsSync.writeFileSync(credsPath, data);
                console.log('✅ MEGA session downloaded successfully');
                return JSON.parse(data.toString());
            } catch (megaError) {
                console.error('❌ MEGA download failed:', megaError.message);
                console.log('Trying Base64 format...');
            }
        }
        
        // ===== CHECK FOR BASE64 FORMAT (IK~) =====
        if (config.SESSION_ID.startsWith('IK~')) {
            console.log('🔁 DETECTED BASE64 SESSION FORMAT');
            const [header, b64data] = config.SESSION_ID.split('~');

            if (header !== "IK" || !b64data) {
                throw new Error("❌ Invalid Base64 session format. Expected 'IK~...'");
            }

            const cleanB64 = b64data.replace('...', '');
            const compressedData = Buffer.from(cleanB64, 'base64');
            const decompressedData = require('zlib').gunzipSync(compressedData);

            fsSync.writeFileSync(credsPath, decompressedData, "utf8");
            console.log("✅ Base64 Session Loaded Successfully");
            return JSON.parse(decompressedData.toString());
        }
        
        // ===== UNKNOWN FORMAT =====
        console.log('❌ Unknown SESSION_ID format. Must start with DJ~ (MEGA) or IK~ (Base64)');
        return null;
        
    } catch (error) {
        console.error('❌ Error loading session:', error.message);
        console.log('Will generate QR code instead');
        return null;
    }
}

// Import GroupEvents
const GroupEvents = require('./lib/groupevents');

// Main connection function
async function connectToWA() {
  console.log("[ 🟠 ] Connecting to WhatsApp");
  
  // Load session credentials
  const creds = await loadSession();
  
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'sessions'), {
      creds: creds || undefined
  });
  
  // Get latest version
  const { version } = await fetchLatestBaileysVersion();
  
  // Create connection
  let conn = makeWASocket({
      logger: P({ level: 'silent' }),
      printQRInTerminal: !creds,
      browser: Browsers.macOS("Safari"),
      syncFullHistory: false,
      auth: state,
      version,
      getMessage: async () => ({})
  });
  
  // Connection update handler
  conn.ev.on('connection.update', async (update) => {
    try {
        const { connection, lastDisconnect, qr } = update;
        
        if (connection === 'close') {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('[🔰] Connection lost, reconnecting in 5 seconds...');
                setTimeout(() => {
                    connectToWA();
                }, 5000);
            } else {
                console.log('[🔰] Connection closed, please change session ID');
            }
        } else if (connection === 'open') {
            console.log('[🔰] KHAN MD connected to WhatsApp ✅');       
            
            // Load plugins
            const pluginPath = path.join(__dirname, "plugins");
            try {
                fsSync.readdirSync(pluginPath).forEach((plugin) => {
                    if (path.extname(plugin).toLowerCase() === ".js") {
                        require(path.join(pluginPath, plugin));
                    }
                });
                console.log('[🔰] Plugins installed successfully ✅');
            } catch (err) {
                console.error("[ ❌ ] Error loading plugins", { Error: err.message });
            }

            // Send connection message
            try {
                await sleep(2000);
                
                // Local image path
                const imagePath = path.join(__dirname, 'lib/khanmd.jpg');
                
                if (fsSync.existsSync(imagePath)) {
                    const startMess = {
                        image: { url: imagePath },
                        caption: `╭─〔 *🤖 ${config.BOT_NAME}* 〕  
├─▸ *Ultra Super Fast Powerfull ⚠️*  
│     *World Best BOT ${config.BOT_NAME}* 
╰─➤ *Your Smart WhatsApp Bot is Ready To use 🍁!*  

- *🖤 Thank You for Choosing ${config.BOT_NAME}!* 

╭──〔 🔗 *Information* 〕  
├─ 🧩 *Prefix:* = ${config.PREFIX}
├─ 📢 *Join Channel:*  
│    https://whatsapp.com/channel/0029VatOy2EAzNc2WcShQw1j  
├─ 🌟 *Star the Repo:*  
│    https://github.com/JawadYT36/KHAN-MD  
╰─🚀 *Powered by ${config.OWNER_NAME}*`,
                        contextInfo: {
                            forwardingScore: 5,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363354023106228@newsletter',
                                newsletterName: config.BOT_NAME,
                                serverMessageId: 143
                            }
                        }
                    };

                    await conn.sendMessage(conn.user.id.split(':')[0] + '@s.whatsapp.net', startMess, { disappearingMessagesInChat: true, ephemeralExpiration: 100 });
                    console.log('KHAN-MD IS ACTIVE ✅');
                }
            } catch (sendError) {
                console.error('[🔰] Error sending messages:', sendError);
            }
        }

        if (qr) {
            console.log('[🔰] Scan the QR code to connect or use session ID');
        }
    } catch (error) {
        console.error('[CONNECTION HANDLER ERROR]', error);
    }
  });

  conn.ev.on('creds.update', saveCreds);

  // Anti Delete with null check
  conn.ev.on('messages.update', async updates => {
    try {
        for (const update of updates) {
            if (update.update && update.update.message === null) {
                console.log("[ 🗑️ ] Delete Detected");
                await AntiDelete(conn, updates).catch(() => {});
            }
        }
    } catch (error) {
        console.error('[ANTI-DELETE ERROR]', error);
    }
  });
  
  // ==================== GROUP EVENTS HANDLER ====================
  conn.ev.on("group-participants.update", (update) => GroupEvents(conn, update));
  
  // call event - only active if ANTI_CALL is true
  if (config.ANTI_CALL === "true") {
    conn.ev.on("call", async (calls) => {
      try {
        for (const call of calls) {
          if (!call) continue;
          
          // Ignore group calls
          if (call.from && call.from.endsWith('@g.us')) {
            console.log("[ ℹ️ ] Ignoring group call from:", call.from);
            continue;
          }

          // Reject calls from @lid users
          if (call.from && call.from.endsWith('@lid')) {
            console.log("[ ℹ️ ] Ignoring lid call from:", call.from);
            continue;
          }

          // Only process incoming call offers
          if (call.status !== "offer") continue;

          const id = call.id;
          const from = call.from;

          // Reject the call
          await conn.rejectCall(id, from);
          
          // Add delay
          await delay(1000);
          
          // Send rejection message
          await conn.sendMessage(from, {
            text: config.REJECT_MSG || "*📞 ᴄαℓℓ ɴσт αℓℓσωє∂ ιɴ тнιѕ ɴᴜмвєʀ уσυ ∂σɴт нανє ᴘєʀмιѕѕισɴ 📵*",
          });
          
          console.log("[ ✅ ] Rejected call from:", from);
        }
      } catch (err) {
        console.error("[ ❌ ] Anti-call error", { Error: err.message });
      }
    });
  }
  
  // ==================== MAIN MESSAGE HANDLER ====================
  conn.ev.on('messages.upsert', async(mek) => {
    try {
      mek = mek.messages[0]
      if (!mek || !mek.message) return
      
      mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
      ? mek.message.ephemeralMessage.message 
      : mek.message;
      
      // Read message if enabled
      if (config.READ_MESSAGE === 'true') {
        await conn.readMessages([mek.key]).catch(() => {});
      }
      
      // Auto view status with LID conversion exactly as specified
      if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true") {
        try {
          // Convert LID to phone number if needed
          let statusUploader = mek.key.participant;
          if (statusUploader && statusUploader.includes('@lid')) {
            const phoneNumber = await lidToPhone(conn, statusUploader);
            statusUploader = phoneNumber + '@s.whatsapp.net';
          }

          // Use the converted JID for reading
          const readKey = {
            ...mek.key,
            participant: statusUploader
          };
          await conn.readMessages([readKey]).catch(() => {});
          console.log(`[STATUS] Viewed status from ${statusUploader}`);
        } catch (error) {
          console.error('[STATUS] Error viewing status:', error);
        }
      }
      
      if(mek.message.viewOnceMessageV2)
        mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message

      const newsletterJids = [
        "120363354023106228@newsletter",
        "120363421818912466@newsletter",
        "120363422074850441@newsletter", 
        "120363420122180789@newsletter",
        "120363422435843017@newsletter",
        "120363423664056770@newsletter",
        "120363424158644655@newsletter",
        "120363405185673541@newsletter",
        "120363423495243129@newsletter",
        "120363407122137326@newsletter"
      ];

      const emojis = ["❤️", "👍", "😮", "😎", "💀"];

      if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
        try {
          const serverId = mek.key.server_id;
          
          if (serverId) {
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            await conn.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji).catch(() => {});
          }
        } catch (e) {
          console.error('Newsletter reaction error:', e);
        }
      }
      
      await Promise.all([
        saveMessage(mek).catch(() => {})
      ]);

      const type = getContentType(mek.message);

      // ========== ANTI EDIT ==========
      if (type === 'protocolMessage' && mek.message.protocolMessage?.editedMessage) {
          console.log("[✏️] Edit detected");
          await AntiEdit(conn, mek).catch(() => {});
          return;
      }

      // =========================================
      
      const m = await sms(conn, mek).catch(() => null);
      if (!m) return;
      
      const content = JSON.stringify(mek.message)
      const from = mek.key.remoteJid
      const isReact = m.message && m.message.reactionMessage ? true : false
      
      if (config.ALWAYS_ONLINE === "online") {
        await conn.sendPresenceUpdate('available', from, [mek.key]).catch(() => {});
      } else {
        await conn.sendPresenceUpdate('unavailable', from, [mek.key]).catch(() => {});
      }
      
      const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
      const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
      
      // ===== USE config.PREFIX DIRECTLY =====
      const isCmd = body && body.startsWith(config.PREFIX);
      const command = isCmd ? body.slice(config.PREFIX.length).trim().split(' ').shift().toLowerCase() : ''
      // ======================================
      
      const args = body ? body.trim().split(/ +/).slice(1) : []
      const q = args.join(' ')
      const text = args.join(' ')
      const isGroup = from.endsWith('@g.us')   
      const sender = mek.key.fromMe ? (conn.user.id.split(':')[0]+'@s.whatsapp.net' || conn.user.id) : (mek.key.participant || mek.key.remoteJid)

      // lidToPhone for sender
      let senderNumber = sender ? sender.split('@')[0] : ''
      if (sender && sender.includes('@lid')) {
        senderNumber = await lidToPhone(conn, sender).catch(() => sender.split('@')[0]);
      }
      
      const botNumber = conn.user.id.split(':')[0]
      const pushname = mek.pushName || 'Sin Nombre'
      const isMe = botNumber.includes(senderNumber)
      const isOwner = ownerNumber.includes(senderNumber) || isMe
      const botNumber2 = await jidNormalizedUser(conn.user.lid);
      
      // ===== GROUP METADATA WITH NULL CHECKS (EXACTLY AS SPECIFIED) =====
      const groupMetadata = isGroup ? await conn.groupMetadata(from).catch(e => {}) : ''
      const groupName = isGroup ? groupMetadata.subject : ''
      const participants = isGroup ? await groupMetadata.participants : ''
      const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
      const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
      const isAdmins = isGroup ? groupAdmins.includes(sender) : false
      const reply = (teks) => {
        conn.sendMessage(from, { text: teks }, { quoted: mek }).catch(() => {});
      }  

      // Auto Typing Presence
      if (config.AUTO_TYPING === 'true') {
          await conn.sendPresenceUpdate('composing', from).catch(() => {});
      } 
      else if (config.AUTO_TYPING === 'inbox') {
          if (!isGroup) {
              await conn.sendPresenceUpdate('composing', from).catch(() => {});
          }
      }
      else if (config.AUTO_TYPING === 'group') {
          if (isGroup) {
              await conn.sendPresenceUpdate('composing', from).catch(() => {});
          }
      }

      // Auto Recording Presence
      if (config.AUTO_RECORDING === 'true') {
          await conn.sendPresenceUpdate('recording', from).catch(() => {});
      }
      else if (config.AUTO_RECORDING === 'inbox') {
          if (!isGroup) {
              await conn.sendPresenceUpdate('recording', from).catch(() => {});
          }
      }
      else if (config.AUTO_RECORDING === 'group') {
          if (isGroup) {
              await conn.sendPresenceUpdate('recording', from).catch(() => {});
          }
      }

      // --- ANTI-LINK HANDLER --- (Using JSON file warnings)
      if (isGroup && !isAdmins && isBotAdmins) {
          let cleanBody = body ? body.replace(/[\s\u200b-\u200d\uFEFF]/g, '').toLowerCase() : '';
          const whatsappUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:whatsapp\.com\/channel\/|chat\.whatsapp\.com\/|wa\.me\/)/gi;
          
          if (cleanBody && whatsappUrlRegex.test(cleanBody)) {
              if (mek.key.fromMe || sender === botNumber2) {
                  return;
              }
              
              // Get current warning count before any action
              let warningCount = getLinkWarningCount ? getLinkWarningCount(senderNumber) : 0;
              
              if (config.ANTI_LINK === "true") {
                  // Immediate removal mode
                  if (!isAdmins) {
                      await conn.sendMessage(from, { delete: mek.key }).catch(() => {});
                      await delay(1000);
                      await conn.sendMessage(from, {
                          text: `*⚠️ Links are not allowed in this group.*\n @${senderNumber} *has been removed.*`,
                          mentions: sender ? [sender] : []
                      }, { quoted: mek }).catch(() => {});
                      await delay(1000);
                      if (sender) {
                          await conn.groupParticipantsUpdate(from, [sender], 'remove').catch(() => {});
                      }
                  }
                  return;
                  
              } else if (config.ANTI_LINK === "warn") {
                  // Warning mode
                  if (!isAdmins && addLinkWarning) {
                      let newWarningCount = addLinkWarning(senderNumber);
                      
                      if (newWarningCount === 1) {
                          // First warning
                          await conn.sendMessage(from, { delete: mek.key }).catch(() => {});
                          await delay(1000);
                          await conn.sendMessage(from, {
                              text: `*⚠️ WARNING (1/2)*\n@${senderNumber} *Links are not allowed in this group*\n> *Next time you will be removed*`,
                              mentions: sender ? [sender] : []
                          }, { quoted: mek }).catch(() => {});
                          
                      } else if (newWarningCount >= 2) {
                          // Second time - Remove user
                          await conn.sendMessage(from, { delete: mek.key }).catch(() => {});
                          await delay(1000);
                          await conn.sendMessage(from, {
                              text: `*🚨 Removed* @${senderNumber} *from the group for sharing Links (2 warnings reached)*`,
                              mentions: sender ? [sender] : []
                          }, { quoted: mek }).catch(() => {});
                          await delay(1000);
                          if (sender) {
                              await conn.groupParticipantsUpdate(from, [sender], 'remove').catch(() => {});
                          }
                          
                          // Clear warning for this user after removal
                          if (removeLinkWarning) {
                              removeLinkWarning(senderNumber);
                          }
                      }
                  }
                  return;
                  
              } else if (config.ANTI_LINK === "delete") {
                  // Delete only mode
                  if (!isAdmins) {
                      await conn.sendMessage(from, { delete: mek.key }).catch(() => {});
                      await delay(1000);
                      await conn.sendMessage(from, {
                          text: `*⚠️ Links are not allowed in this group.*\n*Please* @${senderNumber} *take note.*`,
                          mentions: sender ? [sender] : []
                      }, { quoted: mek }).catch(() => {});
                  }
                  return;
              }
          }
      }
      
      // Get sudo numbers from config
      const sudoNumbers = Array.isArray(config.SUDO) 
          ? config.SUDO 
          : config.SUDO ? config.SUDO.split(',').map(s => s.trim()) : [];

      // Check if sender is creator (keeping your original isCreator function)
      let isCreator = false;
      if (sender) {
          isCreator = [
              botNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net',
              botNumber2,
              config.OWNER_NUMBER + '@s.whatsapp.net',
              ...sudoNumbers
          ].includes(
              sender.includes('@lid') 
                  ? (await lidToPhone(conn, sender).catch(() => sender.split('@')[0])) + '@s.whatsapp.net' 
                  : sender
          );
      }

      // Auto React for all messages
      if (!isReact && config.AUTO_REACT === 'true' && senderNumber !== botNumber) {
          if (config.REACT_EMOJIS && config.REACT_EMOJIS.length > 0) {
              const randomReaction = config.REACT_EMOJIS[Math.floor(Math.random() * config.REACT_EMOJIS.length)];
              try {
                  await m.react(randomReaction).catch(() => {});
              } catch (e) {}
          }
      }

      // Owner React
      if (!isReact && senderNumber === botNumber && config.OWNER_REACT === 'true') {
          if (config.OWNER_EMOJIS && config.OWNER_EMOJIS.length > 0) {
              const randomReaction = config.OWNER_EMOJIS[Math.floor(Math.random() * config.OWNER_EMOJIS.length)];
              try {
                  await m.react(randomReaction).catch(() => {});
              } catch (e) {}
          }
      }
      
      // Get banned users from config
      const bannedNumbers = config.BANNED 
          ? (Array.isArray(config.BANNED) ? config.BANNED : config.BANNED.split(',').map(s => s.trim()))
          : [];

      // Check if sender is banned
      const isBanned = senderNumber && bannedNumbers.some(ban => ban.includes(senderNumber));
      if (isBanned) {
          return;
      }

      const ownerNumberFormatted = `${config.OWNER_NUMBER}@s.whatsapp.net`;
      const isSudoUser = senderNumber && sudoNumbers.some(sudo => sudo.includes(senderNumber));
      const isRealOwner = sender === ownerNumberFormatted || isMe || isSudoUser;

      if (!isRealOwner && config.MODE === "private") {
          return;
      }
      if (!isRealOwner && isGroup && config.MODE === "inbox") {
          return;
      }
      if (!isRealOwner && !isGroup && config.MODE === "groups") {
          return;
      }

      const events = require("./command");
      const cmdName = isCmd ? body.slice(config.PREFIX.length).trim().split(" ")[0].toLowerCase() : false;
      
      if (isCmd) {
        const cmd =
          events.commands.find((cmd) => cmd.pattern === cmdName) ||
          events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
        if (cmd) {
          if (cmd.react)
            conn.sendMessage(from, { react: { text: cmd.react, key: mek.key } }).catch(() => {});
          try {
            cmd.function(conn, mek, m, {
              from,
              quoted,
              body,
              isCmd,
              command,
              args,
              q,
              text,
              isGroup,
              sender,
              senderNumber,
              botNumber2,
              botNumber,
              pushname,
              isMe,
              isOwner,
              isCreator,
              groupMetadata,
              groupName,
              participants,
              groupAdmins,
              isBotAdmins,
              isAdmins,
              reply
            });
          } catch (e) {
            console.error("[ ❌ ] Plugin error", { Error: e.message });
          }
        }
      }
      
      events.commands.map(async (command) => {
        if (body && command.on === "body") {
          command.function(conn, mek, m, {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            text,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            isCreator,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply
          }).catch(() => {});
        } else if (mek.q && command.on === "text") {
          command.function(conn, mek, m, {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            text,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            isCreator,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply
          }).catch(() => {});
        } else if (command.on === "image" || (command.on === "photo" && mek.type === "imageMessage")) {
          command.function(conn, mek, m, {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            text,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            isCreator,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply
          }).catch(() => {});
        } else if (command.on === "sticker" && mek.type === "stickerMessage") {
          command.function(conn, mek, m, {
            from,
            quoted,
            body,
            isCmd,
            command,
            args,
            q,
            text,
            isGroup,
            sender,
            senderNumber,
            botNumber2,
            botNumber,
            pushname,
            isMe,
            isOwner,
            isCreator,
            groupMetadata,
            groupName,
            participants,
            groupAdmins,
            isBotAdmins,
            isAdmins,
            reply
          }).catch(() => {});
        }
      });
    } catch (error) {
      console.error('[MAIN HANDLER] Error:', error);
    }
  });
  // ==================== END MAIN MESSAGE HANDLER ====================

  // All your conn helper functions remain the same...
  conn.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    try {
      let vtype;
      if (options.readViewOnce) {
        message.message =
          message.message &&
          message.message.ephemeralMessage &&
          message.message.ephemeralMessage.message
            ? message.message.ephemeralMessage.message
            : message.message || undefined;
        vtype = Object.keys(message.message.viewOnceMessage.message)[0];
        delete (message.message && message.message.ignore ? message.message.ignore : message.message || undefined);
        delete message.message.viewOnceMessage.message[vtype].viewOnce;
        message.message = {
          ...message.message.viewOnceMessage.message,
        };
      }

      let mtype = Object.keys(message.message)[0];
      let content = await generateForwardMessageContent(message, forceForward);
      let ctype = Object.keys(content)[0];
      let context = {};
      if (mtype != "conversation") context = message.message[mtype].contextInfo;
      content[ctype].contextInfo = {
        ...context,
        ...content[ctype].contextInfo,
      };
      const waMessage = await generateWAMessageFromContent(
        jid,
        content,
        options
          ? {
              ...content[ctype],
              ...options,
              ...(options.contextInfo
                ? {
                    contextInfo: {
                      ...content[ctype].contextInfo,
                      ...options.contextInfo,
                    },
                  }
                : {}),
            }
          : {}
      );
      await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
      return waMessage;
    } catch (e) {
      return null;
    }
  };

  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    try {
      let quoted = message.msg ? message.msg : message;
      let mime = (message.msg || message).mimetype || "";
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
      const stream = await downloadContentFromMessage(quoted, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      let type = await FileType.fromBuffer(buffer);
      trueFileName = attachExtension ? filename + "." + type.ext : filename;
      await fs.writeFileSync(trueFileName, buffer);
      return trueFileName;
    } catch (e) {
      return null;
    }
  };

  conn.downloadMediaMessage = async (message) => {
    try {
      let mime = (message.msg || message).mimetype || "";
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
      const stream = await downloadContentFromMessage(message, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      return buffer;
    } catch (e) {
      return null;
    }
  };

  conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    try {
      let mime = "";
      let res = await axios.head(url);
      mime = res.headers["content-type"];
      if (mime.split("/")[1] === "gif") {
        return conn.sendMessage(
          jid,
          { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options },
          { quoted: quoted, ...options }
        );
      }
      let type = mime.split("/")[0] + "Message";
      if (mime === "application/pdf") {
        return conn.sendMessage(
          jid,
          { document: await getBuffer(url), mimetype: "application/pdf", caption: caption, ...options },
          { quoted: quoted, ...options }
        );
      }
      if (mime.split("/")[0] === "image") {
        return conn.sendMessage(
          jid,
          { image: await getBuffer(url), caption: caption, ...options },
          { quoted: quoted, ...options }
        );
      }
      if (mime.split("/")[0] === "video") {
        return conn.sendMessage(
          jid,
          { video: await getBuffer(url), caption: caption, mimetype: "video/mp4", ...options },
          { quoted: quoted, ...options }
        );
      }
      if (mime.split("/")[0] === "audio") {
        return conn.sendMessage(
          jid,
          { audio: await getBuffer(url), caption: caption, mimetype: "audio/mpeg", ...options },
          { quoted: quoted, ...options }
        );
      }
    } catch (e) {
      return null;
    }
  };

  conn.cMod = (jid, copy, text = "", sender = conn.user.id.split(':')[0] + "@s.whatsapp.net", options = {}) => {
    try {
      let mtype = Object.keys(copy.message)[0];
      let isEphemeral = mtype === "ephemeralMessage";
      if (isEphemeral) {
        mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
      }
      let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
      let content = msg[mtype];
      if (typeof content === "string") msg[mtype] = text || content;
      else if (content.caption) content.caption = text || content.caption;
      else if (content.text) content.text = text || content.text;
      if (typeof content !== "string")
        msg[mtype] = {
          ...content,
          ...options,
        };
      if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
      else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
      if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid;
      else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid;
      copy.key.remoteJid = jid;
      copy.key.fromMe = sender === conn.user.id.split(':')[0] + "@s.whatsapp.net";
      return proto.WebMessageInfo.fromObject(copy);
    } catch (e) {
      return copy;
    }
  };

  conn.getFile = async (PATH, save) => {
    try {
      let res;
      let data = Buffer.isBuffer(PATH)
        ? PATH
        : /^data:.*?\/.*?;base64,/i.test(PATH)
        ? Buffer.from(PATH.split`,`[1], "base64")
        : /^https?:\/\//.test(PATH)
        ? await (res = await getBuffer(PATH))
        : fs.existsSync(PATH)
        ? ((filename = PATH), fs.readFileSync(PATH))
        : typeof PATH === "string"
        ? PATH
        : Buffer.alloc(0);
      let type = await FileType.fromBuffer(data) || {
        mime: "application/octet-stream",
        ext: ".bin",
      };
      let filename = path.join(__filename, __dirname + new Date() * 1 + "." + type.ext);
      if (data && save) fs.promises.writeFile(filename, data);
      return {
        res,
        filename,
        size: await getSizeMedia(data),
        ...type,
        data,
      };
    } catch (e) {
      return null;
    }
  };

  conn.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
    try {
      let types = await conn.getFile(PATH, true);
      let { filename, size, ext, mime, data } = types;
      let type = "",
        mimetype = mime,
        pathFile = filename;
      if (options.asDocument) type = "document";
      if (options.asSticker || /webp/.test(mime)) {
        let { writeExif } = require("./exif.js");
        let media = { mimetype: mime, data };
        pathFile = await writeExif(media, {
          packname: Config.packname,
          author: Config.packname,
          categories: options.categories ? options.categories : [],
        });
        await fs.promises.unlink(filename);
        type = "sticker";
        mimetype = "image/webp";
      } else if (/image/.test(mime)) type = "image";
      else if (/video/.test(mime)) type = "video";
      else if (/audio/.test(mime)) type = "audio";
      else type = "document";
      await conn.sendMessage(
        jid,
        {
          [type]: { url: pathFile },
          mimetype,
          fileName,
          ...options,
        },
        { quoted, ...options }
      );
      return fs.promises.unlink(pathFile);
    } catch (e) {
      return null;
    }
  };

  conn.parseMention = async (text) => {
    try {
      return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + "@s.whatsapp.net");
    } catch (e) {
      return [];
    }
  };

  conn.sendMedia = async (jid, path, fileName = "", caption = "", quoted = "", options = {}) => {
    try {
      let types = await conn.getFile(path, true);
      let { mime, ext, res, data, filename } = types;
      if (res && res.status !== 200 || file.length <= 65536) {
        try { throw { json: JSON.parse(file.toString()) }; } catch (e) { if (e.json) throw e.json; }
      }
      let type = "",
        mimetype = mime,
        pathFile = filename;
      if (options.asDocument) type = "document";
      if (options.asSticker || /webp/.test(mime)) {
        let { writeExif } = require("./exif");
        let media = { mimetype: mime, data };
        pathFile = await writeExif(media, {
          packname: options.packname ? options.packname : Config.packname,
          author: options.author ? options.author : Config.author,
          categories: options.categories ? options.categories : [],
        });
        await fs.promises.unlink(filename);
        type = "sticker";
        mimetype = "image/webp";
      } else if (/image/.test(mime)) type = "image";
      else if (/video/.test(mime)) type = "video";
      else if (/audio/.test(mime)) type = "audio";
      else type = "document";
      await conn.sendMessage(
        jid,
        {
          [type]: { url: pathFile },
          caption,
          mimetype,
          fileName,
          ...options,
        },
        { quoted, ...options }
      );
      return fs.promises.unlink(pathFile);
    } catch (e) {
      return null;
    }
  };

  conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
    try {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifVid(buff, options);
      } else {
        buffer = await videoToWebp(buff);
      }
      await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
    } catch (e) {}
  };

  conn.sendImageAsSticker = async (jid, buff, options = {}) => {
    try {
      let buffer;
      if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options);
      } else {
        buffer = await imageToWebp(buff);
      }
      await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
    } catch (e) {}
  };

  conn.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
    conn.sendMessage(
      jid,
      { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map((v) => v[1] + "@s.whatsapp.net") }, ...options },
      { quoted }
    ).catch(() => {});

  conn.sendImage = async (jid, path, caption = "", quoted = "", options) => {
    try {
      let buffer = Buffer.isBuffer(path)
        ? path
        : /^data:.*?\/.*?;base64,/i.test(path)
        ? Buffer.from(path.split`,`[1], "base64")
        : /^https?:\/\//.test(path)
        ? await (await getBuffer(path))
        : fs.existsSync(path)
        ? fs.readFileSync(path)
        : Buffer.alloc(0);
      return await conn.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
    } catch (e) {
      return null;
    }
  };

  conn.sendText = (jid, text, quoted = "", options) => 
    conn.sendMessage(jid, { text: text, ...options }, { quoted }).catch(() => {});

  conn.sendButtonText = (jid, buttons = [], text, footer, quoted = "", options = {}) => {
    let buttonMessage = {
      text,
      footer,
      buttons,
      headerType: 2,
      ...options,
    };
    conn.sendMessage(jid, buttonMessage, { quoted, ...options }).catch(() => {});
  };

  conn.send5ButImg = async (jid, text = "", footer = "", img, but = [], thumb, options = {}) => {
    try {
      let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: conn.waUploadToServer });
      var template = generateWAMessageFromContent(
        jid,
        proto.Message.fromObject({
          templateMessage: {
            hydratedTemplate: {
              imageMessage: message.imageMessage,
              hydratedContentText: text,
              hydratedFooterText: footer,
              hydratedButtons: but,
            },
          },
        }),
        options
      );
      conn.relayMessage(jid, template.message, { messageId: template.key.id });
    } catch (e) {}
  };

  conn.getName = (jid, withoutContact = false) => {
    try {
      id = conn.decodeJid(jid);
      withoutContact = conn.withoutContact || withoutContact;
      let v;
      if (id.endsWith("@g.us"))
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {};
          if (!(v.name.notify || v.subject)) v = conn.groupMetadata(id) || {};
          resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
        });
      else
        v =
          id === "0@s.whatsapp.net"
            ? {
                id,
                name: "WhatsApp",
              }
            : id === conn.decodeJid(conn.user.id.split(':')[0] + "@s.whatsapp.net")
            ? conn.user
            : store.contacts[id] || {};
      return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
    } catch (e) {
      return jid.split('@')[0];
    }
  };

  conn.sendContact = async (jid, kon, quoted = "", opts = {}) => {
    try {
      let list = [];
      for (let i of kon) {
        list.push({
          displayName: await conn.getName(i + "@s.whatsapp.net"),
          vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(i + "@s.whatsapp.net")}\nFN:${global.OwnerName}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${global.email}\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${global.github}/khan-xd\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${global.location};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
        });
      }
      conn.sendMessage(
        jid,
        {
          contacts: {
            displayName: `${list.length} Contact`,
            contacts: list,
          },
          ...opts,
        },
        { quoted }
      );
    } catch (e) {}
  };

  conn.setStatus = (status) => {
    try {
      conn.query({
        tag: "iq",
        attrs: {
          to: "@s.whatsapp.net",
          type: "set",
          xmlns: "status",
        },
        content: [
          {
            tag: "status",
            attrs: {},
            content: Buffer.from(status, "utf-8"),
          },
        ],
      });
      return status;
    } catch (e) {
      return status;
    }
  };

  conn.serializeM = (mek) => sms(conn, mek, store);
}

async function getSizeMedia(buffer) {
  return buffer.length;
}

// Remove the old error handlers as requested
// process.on("uncaughtException", ...) - REMOVED
// process.on("unhandledRejection", ...) - REMOVED

// Start the bot
setTimeout(() => {
  connectToWA();
}, 4000);
