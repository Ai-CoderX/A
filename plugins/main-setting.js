// Jawad TechX On Top 🔝 

const { setPrefix } = require('../lib/prefix');
const { cmd, commands } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions');
const { writeFileSync } = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const { getLinkWarnings, saveLinkWarnings, addLinkWarning, removeLinkWarning, getBadWordWarnings, saveBadWordWarnings, addBadWordWarning, removeBadWordWarning } = require('../lib/warning');
const { lidToPhone, cleanPN } = require("../lib/fixlid");

// Placeholder for soft reload function (used only in prefix and mode commands)
async function reloadConfig() {
  // Reinitialize command listeners, event handlers, or other components if needed
  console.log("Configuration reloaded without restart.");
}

// Helper function to convert target to proper format
async function getTargetJid(conn, target) {
    if (!target) return null;
    
    if (target.includes('@s.whatsapp.net')) return target;
    
    if (target.includes('@lid')) {
        const phoneNumber = await lidToPhone(conn, target);
        return phoneNumber + '@s.whatsapp.net';
    }
    
    return target.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
}

// Helper function to extract number from JID
function extractNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0];
}

// Helper function to validate if target is a valid number
function isValidNumber(target) {
    if (!target) return false;
    const number = target.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    return number.length >= 10;
}

// ==================== PREFIX COMMAND (with reloadConfig) ====================
cmd({
  pattern: "setprefix",
  alias: ["prefix"],
  react: "🪄",
  desc: "Change the bot's command prefix.",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const newPrefix = args[0];
  if (!newPrefix) return reply("*❌ Provide new prefix. Example: .setprefix !*");
  
  if (newPrefix.length !== 1) {
    return reply("*❌ Prefix must be a single character!*");
  }
  
  const isEmoji = /[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u.test(newPrefix);
  
  if (isEmoji) {
    return reply("*❌ Emojis are not allowed as prefix!*");
  }

  // Update config
  setPrefix(newPrefix);
  config.PREFIX = newPrefix;
  process.env.PREFIX = newPrefix;
  
  // Soft reload for command listeners
  await reloadConfig();

  return reply(`*✅ Prefix updated to: ${newPrefix}*\n\n*Example: ${newPrefix}menu*`);
});

// ==================== MODE COMMAND (with reloadConfig) ====================
cmd({
  pattern: "mode",
  alias: ["setmode", "mod"],
  react: "✅",
  desc: "Set bot mode to private or public.",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const currentMode = config.MODE || "public";

  if (!args[0]) {
    return reply(`📌 Current mode: *${currentMode}*\n\nUsage: .mode private OR .mode public`);
  }

  const modeArg = args[0].toLowerCase();

  if (["private", "public"].includes(modeArg)) {
    config.MODE = modeArg;
    process.env.MODE = modeArg;
    
    // Soft reload for command listeners
    await reloadConfig();
    
    await reply(`✅ Bot mode is now set to *${modeArg.toUpperCase()}*.`);
  } else {
    return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
  }
});

// ==================== BOT IMAGE COMMAND ====================
cmd({
  pattern: "botdp",
  alias: ["setbotimage", "botpic", "botimage"],
  desc: "Set the bot's image URL",
  category: "setting",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");

    let imageUrl = args[0];

    // Upload image if replying to one
    if (!imageUrl && m.quoted) {
      const quotedMsg = m.quoted;
      const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
      if (!mimeType.startsWith("image")) return reply("❌ Please reply to an image.");

      const mediaBuffer = await quotedMsg.download();
      const extension = mimeType.includes("jpeg") ? ".jpg" : ".png";
      const tempFilePath = path.join(os.tmpdir(), `botimg_${Date.now()}${extension}`);
      fs.writeFileSync(tempFilePath, mediaBuffer);

      const form = new FormData();
      form.append("fileToUpload", fs.createReadStream(tempFilePath), `botimage${extension}`);
      form.append("reqtype", "fileupload");

      const response = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders()
      });

      fs.unlinkSync(tempFilePath);

      if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
        throw new Error(`Catbox upload failed: ${response.data}`);
      }

      imageUrl = response.data;
    }

    if (!imageUrl || !imageUrl.startsWith("http")) {
      return reply("❌ Provide a valid image URL or reply to an image.");
    }

    // Update config
    config.MENU_IMAGE_URL = imageUrl;
    process.env.MENU_IMAGE_URL = imageUrl;

    await reply(`✅ Bot image updated.\n\n*New URL:* ${imageUrl}`);
  } catch (err) {
    console.error(err);
    reply(`❌ Error: ${err.message || err}`);
  }
});

// ==================== SET BOT NAME ====================
cmd({
  pattern: "setbotname",
  alias: ["botname"],
  desc: "Set the bot's name",
  category: "setting",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  
  const newName = args.join(" ").trim();
  if (!newName) return reply("❌ Provide a bot name.");

  // Update config
  config.BOT_NAME = newName;
  process.env.BOT_NAME = newName;

  await reply(`✅ Bot name updated to: *${newName}*`);
});

// ==================== SET OWNER NAME ====================
cmd({
  pattern: "setownername",
  alias: ["ownername"],
  desc: "Set the owner's name",
  category: "setting",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  
  const name = args.join(" ").trim();
  if (!name) return reply("❌ Provide an owner name.");

  // Update config
  config.OWNER_NAME = name;
  process.env.OWNER_NAME = name;

  await reply(`✅ Owner name updated to: *${name}*`);
});

// ==================== SET BOT DESCRIPTION ====================
cmd({
  pattern: "setdescription",
  alias: ["setdesc", "description", "botdesc"],
  react: "📝",
  desc: "Set the bot's description message",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

    const newDescription = args.join(' ').trim();
    if (!newDescription) {
      return reply(`❌ *Please provide a description*\n\n*Example:* .setdescription ⚡ Powered by JawadTechX\n\n*Current:* ${config.DESCRIPTION || 'Not set'}`);
    }

    // Update config
    config.DESCRIPTION = newDescription;
    process.env.DESCRIPTION = newDescription;

    await reply(`✅ *Bot description updated successfully!*\n\n*New Description:*\n${newDescription}`);
  } catch (error) {
    console.error('Error in setdescription command:', error);
    reply(`❌ Error: ${error.message}`);
  }
});

// ==================== ANTI-CALL ====================
cmd({
  pattern: "anti-call",
  react: "🫟",
  alias: ["anticall"],
  desc: "Enable or disable anti-call feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.ANTI_CALL = "true";
    process.env.ANTI_CALL = "true";
    return reply("*✅ Anti-call has been enabled*");
  } else if (status === "off") {
    config.ANTI_CALL = "false";
    process.env.ANTI_CALL = "false";
    return reply("*❌ Anti-call has been disabled*");
  } else {
    return reply(`*Example: anti-call on/off*`);
  }
});

// ==================== ANTI-DELETE ====================
cmd({
  pattern: "antidelete",
  alias: ["ad", "anti-delete", "antidel"],
  react: "🗑️",
  desc: "Enable/Disable anti-delete feature to show deleted messages",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.ANTI_DELETE = "true";
    process.env.ANTI_DELETE = "true";
    return reply("🗑️ *Anti-delete is now ENABLED*");
  } else if (status === "off") {
    config.ANTI_DELETE = "false";
    process.env.ANTI_DELETE = "false";
    return reply("🗑️ *Anti-delete is now DISABLED*");
  } else {
    return reply(`*🗑️ Anti-delete Command*\n\n• *on* - Enable\n• *off* - Disable\n\n*Example:* .antidelete on`);
  }
});

// ==================== ANTI-EDIT ====================
cmd({
  pattern: "antiedit",
  react: "✏️",
  alias: ["anti-edit", "anti-edit-message"],
  desc: "Enable or disable anti-edit feature\nModes: on/off",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
      config.ANTI_EDIT = "true";
      process.env.ANTI_EDIT = "true";
      await reply("✏️ *Anti-edit feature is now ENABLED*");
    } 
    else if (args[0] === "off") {
      config.ANTI_EDIT = "false";
      process.env.ANTI_EDIT = "false";
      await reply("✏️ *Anti-edit feature is now DISABLED*");
    } 
    else {
      await reply(`*Invalid input! Use:*\n\n• *on* - Enable\n• *off* - Disable\n\n*Example:* .antiedit on`);
    }
  } catch (error) {
    return reply(`*Error:* ${error.message}`);
  }
});

// ==================== ANTI-LINK (SIMPLIFIED - on/off only) ====================
cmd({
  pattern: "antilink",
  alias: ["anti-link"],
  desc: "Enable or disable anti-link feature in groups",
  category: "setting",
  react: "🔗",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
  try {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
      config.ANTI_LINK = "true";
      process.env.ANTI_LINK = "true";
      await reply("🔗 *Anti-link is now ENABLED*");
    } else if (args[0] === "off") {
      config.ANTI_LINK = "false";
      process.env.ANTI_LINK = "false";
      await reply("🔗 *Anti-link is now DISABLED*");
    } else {
      const current = config.ANTI_LINK || "false";
      await reply(`*Current Status:* ${current === "true" ? "ON" : "OFF"}\n\n• *on* - Enable\n• *off* - Disable\n\n*Example:* .antilink on`);
    }
  } catch (error) {
    return reply(`*Error:* ${error.message}`);
  }
});

// ==================== ANTI-BAD WORD ====================
cmd({
    pattern: "antibat",
    alias: ["antibad", "anti-bad"],
    desc: "Enable/disable anti-bad word feature",
    category: "setting",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const status = args[0]?.toLowerCase();
        
        if (status === "on") {
            config.ANTI_BAD_WORD = "true";
            process.env.ANTI_BAD_WORD = "true";
            reply("✅ *Anti-bad word is now ENABLED*");
        } 
        else if (status === "off") {
            config.ANTI_BAD_WORD = "false";
            process.env.ANTI_BAD_WORD = "false";
            reply("❌ *Anti-bad word is now DISABLED*");
        }
        else {
            const current = config.ANTI_BAD_WORD || "false";
            reply(`*Current:* ${current === "true" ? "ON" : "OFF"}\n\n*Options:* on / off\n\n*Example:* .antibat on`);
        }

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== ADD BAD WORD ====================
cmd({
    pattern: "addbadword",
    alias: ["addbad", "addblockword"],
    desc: "Add a word to bad words list",
    category: "setting",
    react: "➕",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const word = args[0]?.toLowerCase().trim();
        if (!word) return reply("❌ Please provide a word to add.\n\n*Example:* .addbadword fuck");

        let badWords = Array.isArray(config.BAD_WORDS) ? [...config.BAD_WORDS] : [];

        if (badWords.includes(word)) {
            return reply("❌ This word is already in the bad words list!");
        }

        badWords.push(word);
        config.BAD_WORDS = badWords;
        process.env.BAD_WORDS = badWords.join(',');

        await reply(`✅ *Added "${word}" to bad words list*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== REMOVE BAD WORD ====================
cmd({
    pattern: "removebadword",
    alias: ["delbadword", "rmbadword"],
    desc: "Remove a word from bad words list",
    category: "setting",
    react: "➖",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const word = args[0]?.toLowerCase().trim();
        if (!word) return reply("❌ Please provide a word to remove.\n\n*Example:* .removebadword fuck");

        let badWords = Array.isArray(config.BAD_WORDS) ? [...config.BAD_WORDS] : [];

        if (!badWords.includes(word)) {
            return reply("❌ This word is not in the bad words list!");
        }

        badWords = badWords.filter(w => w !== word);
        config.BAD_WORDS = badWords;
        process.env.BAD_WORDS = badWords.join(',');

        await reply(`✅ *Removed "${word}" from bad words list*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== WELCOME (SIMPLIFIED - on/off only) ====================
cmd({
  pattern: "welcome",
  alias: ["setwelcome"],
  react: "👋",
  desc: "Enable or disable welcome/goodbye messages",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.WELCOME = "true";
    config.GOODBYE = "true";
    process.env.WELCOME = "true";
    process.env.GOODBYE = "true";
    return reply("👋 *Welcome/Goodbye messages are now ENABLED*");
  } else if (status === "off") {
    config.WELCOME = "false";
    config.GOODBYE = "false";
    process.env.WELCOME = "false";
    process.env.GOODBYE = "false";
    return reply("👋 *Welcome/Goodbye messages are now DISABLED*");
  } else {
    return reply(`*👋 Welcome Command*\n\n• *on* - Enable welcome/goodbye\n• *off* - Disable welcome/goodbye\n\n*Example:* .welcome on`);
  }
});

// ==================== AUTO-REACT ====================
cmd({
  pattern: "autoreact",
  alias: ["auto-react"],
  react: "🫟",
  desc: "Enable or disable the autoreact feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_REACT = "true";
    process.env.AUTO_REACT = "true";
    await reply("✅ *Auto-react is now ENABLED*");
  } else if (status === "off") {
    config.AUTO_REACT = "false";
    process.env.AUTO_REACT = "false";
    await reply("❌ *Auto-react is now DISABLED*");
  } else {
    await reply(`*Example: .autoreact on*`);
  }
});

// ==================== AUTO-STATUS-VIEW ====================
cmd({
  pattern: "autostatusview",
  alias: ["status-view", "sview", "statusview"],
  desc: "Enable or disable auto-viewing of statuses",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_STATUS_SEEN = "true";
    process.env.AUTO_STATUS_SEEN = "true";
    return reply("✅ *Auto-status-view is now ENABLED*");
  } else if (status === "off") {
    config.AUTO_STATUS_SEEN = "false";
    process.env.AUTO_STATUS_SEEN = "false";
    return reply("❌ *Auto-status-view is now DISABLED*");
  } else {
    return reply(`Example: .autostatusview on`);
  }
});

// ==================== READ MESSAGE ====================
cmd({
  pattern: "read-message",
  alias: ["autoread"],
  desc: "Enable or disable read message feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.READ_MESSAGE = "true";
    process.env.READ_MESSAGE = "true";
    return reply("✅ *Read message feature is now ENABLED*");
  } else if (status === "off") {
    config.READ_MESSAGE = "false";
    process.env.READ_MESSAGE = "false";
    return reply("❌ *Read message feature is now DISABLED*");
  } else {
    return reply(`_example: .read-message on_`);
  }
});

// ==================== ALWAYS ONLINE ====================
cmd({
  pattern: "alwaysonline",
  alias: ["online", "always-online"],
  react: "🟢",
  desc: "Enable always online presence for the bot",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.ALWAYS_ONLINE = "true";
    process.env.ALWAYS_ONLINE = "true";
    return reply("🟢 *Always online is now ENABLED*");
  } else if (status === "off") {
    config.ALWAYS_ONLINE = "false";
    process.env.ALWAYS_ONLINE = "false";
    return reply("🟢 *Always online is now DISABLED*");
  } else {
    return reply(`*Example:* .alwaysonline on`);
  }
});

// ==================== AUTO-TYPING ====================
cmd({
  pattern: "autotyping",
  alias: ["auto-typing", "typing"],
  react: "⌨️",
  desc: "Enable auto-typing presence for the bot",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.AUTO_TYPING = "true";
    process.env.AUTO_TYPING = "true";
    return reply("⌨️ *Auto-typing is now ENABLED*");
  } else if (status === "off") {
    config.AUTO_TYPING = "false";
    process.env.AUTO_TYPING = "false";
    return reply("⌨️ *Auto-typing is now DISABLED*");
  } else {
    return reply(`*Example:* .autotyping on`);
  }
});

// ==================== AUTO-RECORDING ====================
cmd({
  pattern: "autorecording",
  alias: ["recording", "auto-recording"],
  react: "🎙️",
  desc: "Enable auto-recording presence for the bot",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.AUTO_RECORDING = "true";
    process.env.AUTO_RECORDING = "true";
    return reply("🎙️ *Auto-recording is now ENABLED*");
  } else if (status === "off") {
    config.AUTO_RECORDING = "false";
    process.env.AUTO_RECORDING = "false";
    return reply("🎙️ *Auto-recording is now DISABLED*");
  } else {
    return reply(`*Example:* .autorecording on`);
  }
});

// ==================== AUTO-DOWNLOADER ====================
cmd({
    pattern: "autodl",
    alias: ["downloader", "auto-downloader"],
    react: "📥",
    desc: "Enable/disable auto-downloader feature",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

    const status = args[0]?.toLowerCase();
    
    if (status === "on") {
        config.AUTO_DOWNLOADER = "true";
        process.env.AUTO_DOWNLOADER = "true";
        return reply("📥 *Auto-downloader is now ENABLED*");
    } else if (status === "off") {
        config.AUTO_DOWNLOADER = "false";
        process.env.AUTO_DOWNLOADER = "false";
        return reply("📥 *Auto-downloader is now DISABLED*");
    } else {
        return reply(`*Example:* .autodl on`);
    }
});

// ==================== AUTO-STICKER ====================
cmd({
  pattern: "autosticker",
  alias: ["auto-sticker"],
  react: "🫟",
  desc: "Enable or disable auto-sticker feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_STICKER = "true";
    process.env.AUTO_STICKER = "true";
    return reply("✅ *Auto-sticker is now ENABLED*");
  } else if (status === "off") {
    config.AUTO_STICKER = "false";
    process.env.AUTO_STICKER = "false";
    return reply("❌ *Auto-sticker is now DISABLED*");
  } else {
    return reply(`_example: .autosticker on_`);
  }
});

// ==================== AUTO-REPLY ====================
cmd({
  pattern: "autoreply",
  alias: ["auto-reply"],
  react: "🫟",
  desc: "Enable or disable auto-reply feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_REPLY = "true";
    process.env.AUTO_REPLY = "true";
    return reply("✅ *Auto-reply is now ENABLED*");
  } else if (status === "off") {
    config.AUTO_REPLY = "false";
    process.env.AUTO_REPLY = "false";
    return reply("❌ *Auto-reply is now DISABLED*");
  } else {
    return reply(`*Example: .autoreply on*`);
  }
});

// ==================== ADMIN EVENTS ====================
cmd({
  pattern: "admin-events",
  alias: ["adminevents", "adminaction"],
  desc: "Enable or disable admin event notifications",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.ADMIN_ACTION = "true";
    process.env.ADMIN_ACTION = "true";
    return reply("✅ *Admin event notifications are now ENABLED*");
  } else if (status === "off") {
    config.ADMIN_ACTION = "false";
    process.env.ADMIN_ACTION = "false";
    return reply("❌ *Admin event notifications are now DISABLED*");
  } else {
    return reply(`Example: .admin-events on`);
  }
});

// ==================== OWNER REACT ====================
cmd({
  pattern: "ownerreact",
  alias: ["owner-react", "selfreact", "self-react"],
  react: "👑",
  desc: "Enable or disable the owner react feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.OWNER_REACT = "true";
    process.env.OWNER_REACT = "true";
    await reply("👑 *Owner react is now ENABLED*");
  } else if (status === "off") {
    config.OWNER_REACT = "false";
    process.env.OWNER_REACT = "false";
    await reply("👑 *Owner react is now DISABLED*");
  } else {
    await reply(`*Example: .ownerreact on*`);
  }
});

// ==================== SET STATUS EMOJIS ====================
cmd({
    pattern: "statusemojis",
    alias: ["semoji", "ssreact", "statusreact"],
    react: "😎",
    desc: "Set emojis for status reactions (max 50)\nExample: .statusemojis 🥺,🙃,😂,❤️",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("*📛 Owner only!*");

        const input = args.join(' ').trim();
        if (!input) {
            const currentEmojis = Array.isArray(config.STATUS_LIKE_EMOJIS) 
                ? config.STATUS_LIKE_EMOJIS.join(', ') 
                : "❤️, 🔥, 👍, 😍, 💯";
            return reply(`❌ *Example:* .statusemojis 🥺,🙃,😂,❤️\n\n*Current:* ${currentEmojis}`);
        }

        if (!input.includes(',')) {
            return reply('❌ *Use commas to separate emojis*\n*Example:* .statusemojis 🥺,🙃,😂,❤️');
        }
        
        const emojis = input.split(',').map(e => e.trim()).filter(e => e.length > 0);
        
        if (emojis.length === 0) return reply('❌ *No valid emojis provided*');
        if (emojis.length > 50) return reply('❌ *Maximum 50 emojis allowed*');

        // Store as array in config
        config.STATUS_LIKE_EMOJIS = emojis;
        process.env.STATUS_LIKE_EMOJIS = emojis.join(',');

        await reply(`✅ *Status emojis set!*\n\n${emojis.join(' ')}\n\n*Total: ${emojis.length} emojis*`);
        
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// ==================== SET REACTION EMOJIS ====================
cmd({
    pattern: "setemojis",
    alias: ["remoji", "reactemojis", "setreaction", "reacts"],
    react: "🔥",
    desc: "Set emojis for auto message reactions (max 50)\nExample: .reacts 🚫,🙃,😂,🥺",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("*📛 Owner only!*");

        const input = args.join(' ').trim();
        if (!input) {
            const currentEmojis = Array.isArray(config.REACT_EMOJIS) 
                ? config.REACT_EMOJIS.join(', ') 
                : "❤️, 🔥, 👍, 😍, 😂, 😮, 😎, 🥰";
            return reply(`❌ *Example:* .reacts 🚫,🙃,😂,🥺\n\n*Current:* ${currentEmojis}`);
        }

        if (!input.includes(',')) {
            return reply('❌ *Use commas to separate emojis*\n*Example:* .reacts 🚫,🙃,😂,🥺');
        }
        
        const emojis = input.split(',').map(e => e.trim()).filter(e => e.length > 0);
        
        if (emojis.length === 0) return reply('❌ *No valid emojis provided*');
        if (emojis.length > 50) return reply('❌ *Maximum 50 emojis allowed*');

        // Store as array in config
        config.REACT_EMOJIS = emojis;
        process.env.REACT_EMOJIS = emojis.join(',');

        await reply(`✅ *Reaction emojis set!*\n\n${emojis.join(' ')}\n\n*Total: ${emojis.length} emojis*`);
        
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// ==================== SET OWNER EMOJIS ====================
cmd({
    pattern: "owneremoji",
    alias: ["oemoji", "setownerreaction", "ownereacts"],
    react: "👑",
    desc: "Set emojis for owner reactions (max 50)\nExample: .ownereacts 👑,💎,🤖,⚡,🚫",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("*📛 Owner only!*");

        const input = args.join(' ').trim();
        if (!input) {
            const currentEmojis = Array.isArray(config.OWNER_EMOJIS) 
                ? config.OWNER_EMOJIS.join(', ') 
                : "👑, 💎, ⭐, ✨, 🔥, 💯";
            return reply(`❌ *Example:* .ownereacts 👑,💎,🤖,⚡,🚫\n\n*Current:* ${currentEmojis}`);
        }

        if (!input.includes(',')) {
            return reply('❌ *Use commas to separate emojis*\n*Example:* .ownereacts 👑,💎,🤖,⚡,🚫');
        }
        
        const emojis = input.split(',').map(e => e.trim()).filter(e => e.length > 0);
        
        if (emojis.length === 0) return reply('❌ *No valid emojis provided*');
        if (emojis.length > 50) return reply('❌ *Maximum 50 emojis allowed*');

        // Store as array in config
        config.OWNER_EMOJIS = emojis;
        process.env.OWNER_EMOJIS = emojis.join(',');

        await reply(`✅ *Owner emojis set!*\n\n${emojis.join(' ')}\n\n*Total: ${emojis.length} emojis*`);
        
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// ==================== HELP/SETTINGS GUIDE ====================
cmd({
    pattern: "setting",
    alias: ["settings", "help", "config", "setting", "env"],
    react: "📚",
    desc: "Show how to enable/disable bot settings",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let guideText = `╭─〔 📚 *SETTINGS GUIDE* 〕\n`;
        guideText += `├─ *How To Manage The Settings*\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 🤖 *BOT CORE* 〕\n`;
        guideText += `├─ *Set Prefix:* .setprefix .\n`;
        guideText += `├─ *Set Mode:* .mode public / .mode private\n`;
        guideText += `├─ *Set Bot Name:* .setbotname KHAN-MD\n`;
        guideText += `├─ *Set Owner Name:* .setownername JawadTech\n`;
        guideText += `├─ *Set Bot Image:* .botdp (reply to image)\n`;
        guideText += `├─ *Set Description:* .setdescription Text\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 🛡️ *ANTI FEATURES* 〕\n`;
        guideText += `├─ *Anti-Call:* .anti-call on / off\n`;
        guideText += `├─ *Anti-Delete:* .antidelete on / off\n`;
        guideText += `├─ *Anti-Edit:* .antiedit on / off\n`;
        guideText += `├─ *Anti-Link:* .antilink on / off\n`;
        guideText += `├─ *Anti-Bad Word:* .antibat on / off\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 👋 *WELCOME* 〕\n`;
        guideText += `├─ *Welcome:* .welcome on / off\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 😊 *REACTIONS* 〕\n`;
        guideText += `├─ *Auto React:* .autoreact on / off\n`;
        guideText += `├─ *Owner React:* .ownerreact on / off\n`;
        guideText += `├─ *Status View:* .autostatusview on / off\n`;
        guideText += `├─ *Set React Emojis:* .setemojis ❤️,🔥,👍\n`;
        guideText += `├─ *Set Status Emojis:* .statusemojis ❤️,🔥,👍\n`;
        guideText += `├─ *Set Owner Emojis:* .owneremoji 👑,💎,🤖\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 📱 *PRESENCE* 〕\n`;
        guideText += `├─ *Always Online:* .alwaysonline on / off\n`;
        guideText += `├─ *Auto Typing:* .autotyping on / off\n`;
        guideText += `├─ *Auto Recording:* .autorecording on / off\n`;
        guideText += `├─ *Read Message:* .read-message on / off\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 📥 *AUTO FEATURES* 〕\n`;
        guideText += `├─ *Auto Downloader:* .autodl on / off\n`;
        guideText += `├─ *Auto Sticker:* .autosticker on / off\n`;
        guideText += `├─ *Auto Reply:* .autoreply on / off\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 👑 *OWNER* 〕\n`;
        guideText += `├─ *Admin Events:* .admin-events on / off\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `> ${config.DESCRIPTION || 'KHAN-MD'}`;

        await reply(guideText);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== ENV LIST - SHOW CURRENT VALUES ====================
cmd({
    pattern: "envlist",
    alias: ["showconfig"],
    react: "📋",
    desc: "Show all current bot configuration values",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const formatValue = (val) => {
            if (val === undefined || val === null) return 'Not Set';
            if (Array.isArray(val)) {
                if (val.length === 0) return 'None';
                return val.map(v => {
                    if (v.includes('@s.whatsapp.net')) return v.split('@')[0];
                    return v;
                }).join(', ');
            }
            return val;
        };

        let envText = `╭─〔 📋 *CURRENT CONFIGURATION* 〕\n`;
        envText += `├─ *Bot Name:* ${config.BOT_NAME || 'KHAN-MD'}\n`;
        envText += `├─ *Owner:* ${config.OWNER_NAME || 'JawadTech'} (${config.OWNER_NUMBER || '923427582273'})\n`;
        envText += `├─ *Prefix:* ${config.PREFIX || '.'}\n`;
        envText += `├─ *Mode:* ${config.MODE || 'private'}\n`;
        envText += `├─ *Version:* ${config.VERSION || '10.0 Beta'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 🛡️ *ANTI FEATURES* 〕\n`;
        envText += `├─ *ANTI_CALL:* ${config.ANTI_CALL || 'false'}\n`;
        envText += `├─ *ANTI_DELETE:* ${config.ANTI_DELETE || 'true'}\n`;
        envText += `├─ *ANTI_EDIT:* ${config.ANTI_EDIT || 'false'}\n`;
        envText += `├─ *ANTI_LINK:* ${config.ANTI_LINK || 'true'}\n`;
        envText += `├─ *ANTI_BAD_WORD:* ${config.ANTI_BAD_WORD || 'false'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 👋 *WELCOME* 〕\n`;
        envText += `├─ *WELCOME:* ${config.WELCOME || 'false'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 😊 *REACTIONS* 〕\n`;
        envText += `├─ *AUTO_REACT:* ${config.AUTO_REACT || 'false'}\n`;
        envText += `├─ *OWNER_REACT:* ${config.OWNER_REACT || 'false'}\n`;
        envText += `├─ *AUTO_STATUS_SEEN:* ${config.AUTO_STATUS_SEEN || 'true'}\n`;
        envText += `├─ *STATUS_LIKE_EMOJIS:* ${formatValue(config.STATUS_LIKE_EMOJIS)}\n`;
        envText += `├─ *REACT_EMOJIS:* ${formatValue(config.REACT_EMOJIS)}\n`;
        envText += `├─ *OWNER_EMOJIS:* ${formatValue(config.OWNER_EMOJIS)}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 📱 *PRESENCE* 〕\n`;
        envText += `├─ *ALWAYS_ONLINE:* ${config.ALWAYS_ONLINE || 'false'}\n`;
        envText += `├─ *AUTO_TYPING:* ${config.AUTO_TYPING || 'false'}\n`;
        envText += `├─ *AUTO_RECORDING:* ${config.AUTO_RECORDING || 'false'}\n`;
        envText += `├─ *READ_MESSAGE:* ${config.READ_MESSAGE || 'false'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 📥 *AUTO FEATURES* 〕\n`;
        envText += `├─ *AUTO_DOWNLOADER:* ${config.AUTO_DOWNLOADER || 'false'}\n`;
        envText += `├─ *AUTO_STICKER:* ${config.AUTO_STICKER || 'false'}\n`;
        envText += `├─ *AUTO_REPLY:* ${config.AUTO_REPLY || 'false'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 👑 *OWNER* 〕\n`;
        envText += `├─ *ADMIN_ACTION:* ${config.ADMIN_ACTION || 'false'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `> Use .settings to see how to change these values`;

        await reply(envText);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});
