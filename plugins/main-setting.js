// KHAN XMD - SETTING COMMANDS

const { cmd, commands } = require('../command');
const config = require('../config');
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

// ==================== PREFIX COMMAND ====================
cmd({
  pattern: "setprefix",
  alias: ["prefix"],
  react: "🪄",
  desc: "Change the bot's command prefix.",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
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
  config.PREFIX = newPrefix;

  // Save to MongoDB using CORRECT function name
  if (config.MONGODB_URL && botNumber) {
      await config.updateConfigForNumber(botNumber, { PREFIX: newPrefix });
      console.log(`✅ Prefix saved to MongoDB for ${botNumber}: ${newPrefix}`);
  }

  return reply(`*✅ Prefix updated to: ${newPrefix}*\n\n*Example: ${newPrefix}menu*`);
});

// ==================== BAN COMMANDS ====================

// BAN USER
cmd({
    pattern: "ban",
    alias: ["block"],
    desc: "Ban a user from using the bot",
    category: "setting",
    react: "🔨",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber2, sender, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

        if (!target && args[0]) {
            const cleanedNumber = args[0].replace(/[^0-9]/g, '');
            if (cleanedNumber && cleanedNumber.length >= 10) {
                target = cleanedNumber + "@s.whatsapp.net";
            }
        }

        if (!target || !isValidNumber(target)) {
            return reply("⚠️ Please provide a target to ban!\n\n*Usage:* `.ban @user` or `.ban 92342758****` or reply to a message");
        }

        target = await getTargetJid(conn, target);
        if (!target) return reply("❌ Invalid target format.");

        if (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === botNumber2) 
            return reply("🤖 I can't ban myself!");
        
        if (target.includes(extractNumber(config.OWNER_NUMBER))) {
            return reply("👑 Cannot ban the owner!");
        }

        let bannedList = Array.isArray(config.BANNED) ? [...config.BANNED] : [];

        if (bannedList.includes(target)) {
            return reply("❌ This user is already banned!");
        }

        bannedList.push(target);
        config.BANNED = bannedList;

        // Update in MongoDB if connected
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { BANNED: bannedList });
        }

        await reply(`✅ *Banned Successfully*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// UNBAN USER
cmd({
    pattern: "unban",
    alias: ["unblock"],
    desc: "Unban a user from using the bot",
    category: "setting",
    react: "🔓",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

        if (!target && args[0]) {
            const cleanedNumber = args[0].replace(/[^0-9]/g, '');
            if (cleanedNumber && cleanedNumber.length >= 10) {
                target = cleanedNumber + "@s.whatsapp.net";
            }
        }

        if (!target || !isValidNumber(target)) {
            return reply("⚠️ Please provide a target to unban!\n\n*Usage:* `.unban @user` or `.unban 92342758****` or reply to a message");
        }

        target = await getTargetJid(conn, target);
        if (!target) return reply("❌ Invalid target format.");

        let bannedList = Array.isArray(config.BANNED) ? [...config.BANNED] : [];

        if (!bannedList.includes(target)) {
            return reply("❌ This user is not banned!");
        }

        bannedList = bannedList.filter(user => user !== target);
        config.BANNED = bannedList;

        // Update in MongoDB if connected
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { BANNED: bannedList });
        }

        await reply(`✅ *Unbanned Successfully*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ANTI EDIT PATH
cmd({
  pattern: "editpath",
  alias: ["antieditpath"],
  react: "⚡",
  desc: "Set edit alert destination",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Owner only*");

  const option = args[0]?.toLowerCase();
  
  if (option === "inbox" || option === "ib") {
    config.ANTIEDIT_PATH = "inbox";
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTIEDIT_PATH: "inbox" });
    }
    return reply("✅ *Edit path set to inbox*");
    
  } else if (option === "same") {
    config.ANTIEDIT_PATH = "same";
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTIEDIT_PATH: "same" });
    }
    return reply("✅ *Edit path set to same chat*");
    
  } else {
    return reply("📌 *.editpath inbox/same*");
  }
});

// ANTI-EDIT
cmd({
  pattern: "antiedit",
  react: "✏️",
  alias: ["anti-edit", "anti-edit-message"],
  desc: "Enable or disable anti-edit feature\nModes: on/off",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  try {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
      config.ANTI_EDIT = "true";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_EDIT: "true" });
      }
      
      await reply("✏️ *Anti-edit feature is now ENABLED*\n\nEdited messages will be captured and reported.");
    } 
    else if (args[0] === "off") {
      config.ANTI_EDIT = "false";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_EDIT: "false" });
      }
      
      await reply("✏️ *Anti-edit feature is now DISABLED*\n\nEdited messages will be ignored.");
    } 
    else {
      await reply(`*Invalid input! Use one of the following modes:*\n\n• *on* - Enable anti-edit\n• *off* - Disable anti-edit\n\n*Example:* .antiedit on\n\n*Current Status:* ${config.ANTI_EDIT === "true" ? "✅ ON" : "❌ OFF"}`);
    }
  } catch (error) {
    return reply(`*Error:* ${error.message}`);
  }
});

// BAN LIST
cmd({
    pattern: "banlist",
    alias: ["banned", "blocklist"],
    desc: "Show list of banned users",
    category: "setting",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let bannedList = Array.isArray(config.BANNED) ? config.BANNED.filter(s => s && s.length > 0) : [];

        if (bannedList.length === 0) {
            return reply("📋 *No banned users found.*");
        }

        let bannedText = "╭─〔 🚫 *BANNED USERS* 〕\n";
        bannedList.forEach((user, index) => {
            const number = extractNumber(user);
            bannedText += `├─ ${index + 1}. ${number}\n`;
        });
        bannedText += "╰─────────────────";

        await reply(bannedText);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== SUDO COMMANDS ====================

// ADD SUDO
cmd({
    pattern: "addsudo",
    alias: ["sudo"],
    desc: "Add a user to sudo list",
    category: "setting",
    react: "➕",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, botNumber2, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

        if (!target && args[0]) {
            const cleanedNumber = args[0].replace(/[^0-9]/g, '');
            if (cleanedNumber && cleanedNumber.length >= 10) {
                target = cleanedNumber + "@s.whatsapp.net";
            }
        }

        if (!target || !isValidNumber(target)) {
            return reply("⚠️ Please provide a target to add as sudo!\n\n*Usage:* `.addsudo @user` or `.addsudo 92342758****` or reply to a message");
        }

        target = await getTargetJid(conn, target);
        if (!target) return reply("❌ Invalid target format.");

        if (target === conn.user.id.split(':')[0] + '@s.whatsapp.net' || target === botNumber2) 
            return reply("🤖 Bot is already sudo!");
        
        if (target.includes(extractNumber(config.OWNER_NUMBER))) {
            return reply("👑 Owner already has sudo privileges!");
        }

        let sudoList = Array.isArray(config.SUDO) ? [...config.SUDO] : [];

        if (sudoList.includes(target)) {
            return reply("❌ This user is already in sudo list!");
        }

        sudoList.push(target);
        config.SUDO = sudoList;

        // Update in MongoDB if connected
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { SUDO: sudoList });
        }

        await reply(`✅ *Sudo Added Successfully*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// REMOVE SUDO
cmd({
    pattern: "delsudo",
    alias: ["removesudo", "rmsudo"],
    desc: "Remove a user from sudo list",
    category: "setting",
    react: "➖",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

        if (!target && args[0]) {
            const cleanedNumber = args[0].replace(/[^0-9]/g, '');
            if (cleanedNumber && cleanedNumber.length >= 10) {
                target = cleanedNumber + "@s.whatsapp.net";
            }
        }

        if (!target || !isValidNumber(target)) {
            return reply("⚠️ Please provide a target to remove from sudo!\n\n*Usage:* `.delsudo @user` or `.delsudo 92342758****` or reply to a message");
        }

        target = await getTargetJid(conn, target);
        if (!target) return reply("❌ Invalid target format.");

        if (target.includes(extractNumber(config.OWNER_NUMBER))) {
            return reply("👑 Cannot remove the owner from sudo!");
        }

        let sudoList = Array.isArray(config.SUDO) ? [...config.SUDO] : [];

        if (!sudoList.includes(target)) {
            return reply("❌ This user is not in sudo list!");
        }

        sudoList = sudoList.filter(user => user !== target);
        config.SUDO = sudoList;

        // Update in MongoDB if connected
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { SUDO: sudoList });
        }

        await reply(`✅ *Sudo Deleted Successfully*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// SUDO LIST
cmd({
    pattern: "sudolist",
    alias: ["sudoers", "sudoerslist"],
    desc: "Show list of sudo users",
    category: "setting",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let sudoList = Array.isArray(config.SUDO) ? config.SUDO.filter(s => s && s.length > 0) : [];

        const ownerNumber = extractNumber(config.OWNER_NUMBER);

        let sudoText = "╭─〔 👑 *SUDO USERS* 〕\n";
        sudoText += `├─ *Owner:* ${ownerNumber}\n`;
        
        if (sudoList.length === 0) {
            sudoText += "├─ *No additional sudo users*\n";
        } else {
            sudoList.forEach((user, index) => {
                const number = extractNumber(user);
                sudoText += `├─ ${index + 1}. ${number}\n`;
            });
        }
        sudoText += "╰─────────────────";

        await reply(sudoText);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// SET BOT MEDIA URL 
cmd({
  pattern: "botdp",
  alias: ["setbotimage", "botpic", "botimage"],
  desc: "Set the bot's media URL",
  category: "setting",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  try {
    if (!isCreator) return reply("❗ Only the bot owner can use this command.");

    if (!m.quoted) return reply("❌ Please reply to an image or video.");

    const quotedMsg = m.quoted;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    
    if (!mimeType.startsWith("image") && !mimeType.startsWith("video")) {
      return reply("❌ Please reply to an image or video.");
    }

    const mediaBuffer = await quotedMsg.download();
    const isImage = mimeType.startsWith("image");
    const extension = isImage ? 
      (mimeType.includes("jpeg") ? ".jpg" : ".png") : 
      (mimeType.includes("mp4") ? ".mp4" : ".gif");
    
    const tempFilePath = path.join(os.tmpdir(), `botmedia_${Date.now()}${extension}`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    const form = new FormData();
    form.append("fileToUpload", fs.createReadStream(tempFilePath), `botmedia${extension}`);
    form.append("reqtype", "fileupload");

    const response = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders()
    });

    fs.unlinkSync(tempFilePath);

    if (typeof response.data !== 'string' || !response.data.startsWith('https://')) {
      throw new Error(`Catbox upload failed: ${response.data}`);
    }

    const mediaUrl = response.data;

    config.BOT_MEDIA_URL = mediaUrl;

    // Update in MongoDB if connected
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { BOT_MEDIA_URL: mediaUrl });
    }

    await reply(`✅ Bot Media URL Updated.\n\n*New URL:* ${mediaUrl}`);
  } catch (err) {
    console.error(err);
    reply(`❌ Error: ${err.message || err}`);
  }
});

// SET BOT NAME
cmd({
  pattern: "setbotname",
  alias: ["botname"],
  desc: "Set the bot's name",
  category: "setting",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  
  const newName = args.join(" ").trim();
  if (!newName) return reply("❌ Provide a bot name.");

  config.BOT_NAME = newName;

  // Update in MongoDB if connected
  if (config.MONGODB_URL && botNumber) {
      await config.updateConfigForNumber(botNumber, { BOT_NAME: newName });
  }

  await reply(`✅ Bot name updated to: *${newName}*`);
});

// SET OWNER NAME
cmd({
  pattern: "setownername",
  alias: ["ownername"],
  desc: "Set the owner's name",
  category: "setting",
  react: "✅",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("❗ Only the bot owner can use this command.");
  
  const name = args.join(" ").trim();
  if (!name) return reply("❌ Provide an owner name.");

  config.OWNER_NAME = name;

  // Update in MongoDB if connected
  if (config.MONGODB_URL && botNumber) {
      await config.updateConfigForNumber(botNumber, { OWNER_NAME: name });
  }

  await reply(`✅ Owner name updated to: *${name}*`);
});

// WELCOME
cmd({
  pattern: "welcome",
  alias: ["setwelcome"],
  react: "✅",
  desc: "Enable or disable welcome messages for new members",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.WELCOME = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { WELCOME: "true" });
    }
    
    return reply("✅ Welcome messages are now enabled.");
  } else if (status === "off") {
    config.WELCOME = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { WELCOME: "false" });
    }
    
    return reply("❌ Welcome messages are now disabled.");
  } else {
    return reply(`Example: .welcome on`);
  }
});

// STATUS REACTION EMOJIS
cmd({
    pattern: "statusemojis",
    alias: ["semoji", "ssreact", "statusreact"],
    react: "😎",
    desc: "Set emojis for status reactions (max 50)\nExample: .statusemojis 🥺,🙃,😂,❤️",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
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

        // Basic validation - just ensure they're not empty
        for (let emoji of emojis) {
            if (emoji.length === 0) {
                return reply(`❌ *Invalid empty emoji*`);
            }
        }

        // Store as array in config (like SUDO and BANNED)
        config.STATUS_LIKE_EMOJIS = emojis;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { STATUS_LIKE_EMOJIS: emojis });
        }

        await reply(`✅ *Status emojis set!*\n\n${emojis.join(' ')}\n\n*Total: ${emojis.length} emojis*`);
        
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// AUTO REACTION EMOJIS
cmd({
    pattern: "setemojis",
    alias: ["remoji", "reactemojis", "setreaction", "reacts"],
    react: "🔥",
    desc: "Set emojis for auto message reactions (max 50)\nExample: .reacts 🚫,🙃,😂,🥺",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
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

        // Basic validation - just ensure they're not empty
        for (let emoji of emojis) {
            if (emoji.length === 0) {
                return reply(`❌ *Invalid empty emoji*`);
            }
        }

        // Store as array in config (like SUDO and BANNED)
        config.REACT_EMOJIS = emojis;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { REACT_EMOJIS: emojis });
        }

        await reply(`✅ *Reaction emojis set!*\n\n${emojis.join(' ')}\n\n*Total: ${emojis.length} emojis*`);
        
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// OWNER REACTION EMOJIS
cmd({
    pattern: "owneremoji",
    alias: ["oemoji", "setownerreaction", "ownereacts"],
    react: "👑",
    desc: "Set emojis for owner reactions (max 50)\nExample: .ownereacts 👑,💎,🤖,⚡,🚫",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
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

        // Basic validation - just ensure they're not empty
        for (let emoji of emojis) {
            if (emoji.length === 0) {
                return reply(`❌ *Invalid empty emoji*`);
            }
        }

        // Store as array in config (like SUDO and BANNED)
        config.OWNER_EMOJIS = emojis;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { OWNER_EMOJIS: emojis });
        }

        await reply(`✅ *Owner emojis set!*\n\n${emojis.join(' ')}\n\n*Total: ${emojis.length} emojis*`);
        
    } catch (error) {
        await reply(`❌ Error: ${error.message}`);
    }
});

// RESET EMOJIS TO DEFAULT
cmd({
    pattern: "resetemojis",
    alias: ["resetallemojis"],
    react: "🔄",
    desc: "Reset all emojis to default",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("*📛 Owner only!*");

        const defaults = {
            STATUS_LIKE_EMOJIS: ["❤️", "🔥", "👍", "😍", "💯"],
            REACT_EMOJIS: ["❤️", "🔥", "👍", "😍", "😂", "😮", "😎", "🥰", "👋", "🤝", "💯", "✨", "⭐", "🎉", "🤗", "😊", "🙌", "💪", "👏", "✅", "🎈", "🎊", "🏆", "⚡", "💫", "👌", "🤙", "💖", "💕", "💗", "👑", "💎", "🌟", "🎯", "🎨", "🎭", "🎪", "🎢", "🎡", "🎠"],
            OWNER_EMOJIS: ["👑", "💎", "⭐", "✨", "🔥", "💯", "✅", "🎉", "🤖", "⚡", "💫", "🌟", "🏆", "👾", "🚀", "💪", "🎯", "🔱", "♾️", "⚜️"]
        };

        config.STATUS_LIKE_EMOJIS = defaults.STATUS_LIKE_EMOJIS;
        config.REACT_EMOJIS = defaults.REACT_EMOJIS;
        config.OWNER_EMOJIS = defaults.OWNER_EMOJIS;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, defaults);
        }

        await reply("✅ *All emojis have been reset to default*");
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ANTI DELETE
cmd({
  pattern: "antidelete",
  alias: ["ad", "anti-delete", "antidel"],
  react: "🗑️",
  desc: "Enable/Disable anti-delete feature to show deleted messages",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.ANTI_DELETE = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTI_DELETE: "true" });
    }
    
    return reply("🗑️ *Anti-delete is now ENABLED for both inbox and groups*");
  } else if (status === "off") {
    config.ANTI_DELETE = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTI_DELETE: "false" });
    }
    
    return reply("🗑️ *Anti-delete is now DISABLED*");
  } else {
    return reply(`*🗑️ Anti-delete Command*\n\n• *on* - Enable for both inbox and groups\n• *off* - Disable completely\n\n*Example:* .antidelete on`);
  }
});

// AUTO DOWNLOADER
cmd({
    pattern: "autodl",
    alias: ["downloader", "auto-downloader"],
    react: "📥",
    desc: "Enable/disable auto-downloader feature",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
    if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

    const status = args[0]?.toLowerCase();
    
    if (status === "on") {
        config.AUTO_DOWNLOADER = "true";
        
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { AUTO_DOWNLOADER: "true" });
        }
        
        return reply("📥 *Auto-downloader is now ENABLED for both inbox and groups*");
    } else if (status === "ib") {
        config.AUTO_DOWNLOADER = "inbox";
        
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { AUTO_DOWNLOADER: "inbox" });
        }
        
        return reply("📥 *Auto-downloader is now ENABLED for inbox only*");
    } else if (status === "gc") {
        config.AUTO_DOWNLOADER = "group";
        
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { AUTO_DOWNLOADER: "group" });
        }
        
        return reply("📥 *Auto-downloader is now ENABLED for groups only*");
    } else if (status === "owner") {
        config.AUTO_DOWNLOADER = "owner";
        
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { AUTO_DOWNLOADER: "owner" });
        }
        
        return reply("📥 *Auto-downloader is now ENABLED for owner only*");
    } else if (status === "off") {
        config.AUTO_DOWNLOADER = "false";
        
        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { AUTO_DOWNLOADER: "false" });
        }
        
        return reply("📥 *Auto-downloader is now DISABLED*");
    } else {
        return reply(`*📥 Auto-downloader Command*\n\n• *on* - Enable for both\n• *ib* - Enable for inbox only\n• *gc* - Enable for groups only\n• *owner* - Enable for owner only\n• *off* - Disable\n\n*Example:* .autodl on`);
    }
});

// REJECT MESSAGE
cmd({
  pattern: "rejectmsg",
  alias: ["rejectmessage", "setreject", "reject"],
  react: "📵",
  desc: "Set custom message for rejected calls",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

  const msg = args.join(' ').trim();
  if (!msg) {
    return reply(`❌ *Please provide a reject message*\n\n*Example:* .rejectmsg 📞 Calls are not allowed, please text instead.`);
  }

  config.REJECT_MSG = msg;

  if (config.MONGODB_URL && botNumber) {
      await config.updateConfigForNumber(botNumber, { REJECT_MSG: msg });
  }

  await reply(`✅ *Reject message updated successfully!*\n\n*New Message:*\n${msg}`);
});

// AUTO STATUS MESSAGE
cmd({
  pattern: "autostatusmsg",
  alias: ["statusmsg", "setstatusmsg"],
  react: "💬",
  desc: "Set custom message for auto status replies",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

  const msg = args.join(' ').trim();
  if (!msg) {
    return reply(`❌ *Please provide a status reply message*\n\n*Example:* .autostatusmsg Thanks for updating status! ✨`);
  }

  config.AUTO_STATUS_MSG = msg;

  if (config.MONGODB_URL && botNumber) {
      await config.updateConfigForNumber(botNumber, { AUTO_STATUS_MSG: msg });
  }

  await reply(`✅ *Auto status reply message updated successfully!*\n\n*New Message:*\n${msg}`);
});

// GOODBYE
cmd({
  pattern: "goodbye",
  alias: ["setgoodbye"],
  react: "✅",
  desc: "Enable or disable goodbye messages when members leave",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.GOODBYE = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { GOODBYE: "true" });
    }
    
    return reply("✅ Goodbye messages are now enabled.");
  } else if (status === "off") {
    config.GOODBYE = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { GOODBYE: "false" });
    }
    
    return reply("❌ Goodbye messages are now disabled.");
  } else {
    return reply(`Example: .goodbye on`);
  }
});

// SET WELCOME MESSAGE
cmd({
    pattern: "setwelcome",
    alias: ["welcomemsg", "setwel"],
    react: "📝",
    desc: "Set welcome message (reply to image to set image, text only removes image)",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

        const msg = args.join(' ').trim();
        
        const isValidImageUrl = (url) => {
            if (!url || typeof url !== 'string' || url.trim() === '') return false;
            const urlLower = url.toLowerCase();
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            return imageExtensions.some(ext => urlLower.endsWith(ext));
        };
        
        // CASE 1: User replied to an image
        if (m.quoted) {
            const mimeType = (m.quoted.msg || m.quoted).mimetype || '';
            
            if (mimeType.startsWith("image")) {
                const mediaBuffer = await m.quoted.download();
                const tempFilePath = path.join(os.tmpdir(), `welcome_${Date.now()}.jpg`);
                fs.writeFileSync(tempFilePath, mediaBuffer);

                const form = new FormData();
                form.append("fileToUpload", fs.createReadStream(tempFilePath));
                form.append("reqtype", "fileupload");

                const response = await axios.post("https://catbox.moe/user/api.php", form, {
                    headers: form.getHeaders()
                });

                fs.unlinkSync(tempFilePath);
                
                if (response.data.startsWith('https://')) {
                    config.WELCOME_IMAGE = response.data;
                    
                    if (msg) {
                        config.WELCOME_MSG = msg;
                        
                        if (config.MONGODB_URL && botNumber) {
                            await config.updateConfigForNumber(botNumber, { 
                                WELCOME_IMAGE: response.data,
                                WELCOME_MSG: msg 
                            });
                        }
                        
                        await reply(`✅ *Welcome settings updated!*\n\n*Message:* ${msg}\n*Image:* Uploaded successfully`);
                    } else {
                        if (config.MONGODB_URL && botNumber) {
                            await config.updateConfigForNumber(botNumber, { WELCOME_IMAGE: response.data });
                        }
                        
                        await reply(`✅ *Welcome image updated!*\n\n*Image:* Uploaded successfully\n*Message:* Keeping previous message`);
                    }
                    return;
                } else {
                    return reply("❌ Failed to upload image to catbox");
                }
            } else {
                return reply("❌ Please reply to an image file (jpg, png, etc)");
            }
        }
        
        // CASE 2: Just text (NO image reply) - THIS REMOVES THE IMAGE
        if (msg) {
            config.WELCOME_MSG = msg;
            config.WELCOME_IMAGE = "";
            
            if (config.MONGODB_URL && botNumber) {
                await config.updateConfigForNumber(botNumber, { 
                    WELCOME_MSG: msg,
                    WELCOME_IMAGE: "" 
                });
            }
            
            await reply(`✅ *Welcome message set (TEXT ONLY - image removed)*\n\n*New Message:*\n${msg}\n\n*Available placeholders:*\n• @user - Mentions new user\n• @group - Group name\n• @desc - Group description\n• @count - Member count\n• @time - Current time\n• @bot - Bot name`);
        } else {
            await reply(`❌ *Please provide a message or reply to an image*\n\n*Examples:*\n• Text only: .setwelcome Welcome @user to @group!\n• With image: [reply to image] .setwelcome Hey @user!\n• Image only: [reply to image] .setwelcome`);
        }
        
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// SET GOODBYE MESSAGE
cmd({
    pattern: "setgoodbye",
    alias: ["goodbyemsg", "setgb"],
    react: "📝",
    desc: "Set goodbye message (reply to image to set image, text only removes image)",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

        const msg = args.join(' ').trim();
        
        const isValidImageUrl = (url) => {
            if (!url || typeof url !== 'string' || url.trim() === '') return false;
            const urlLower = url.toLowerCase();
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            return imageExtensions.some(ext => urlLower.endsWith(ext));
        };
        
        // CASE 1: User replied to an image
        if (m.quoted) {
            const mimeType = (m.quoted.msg || m.quoted).mimetype || '';
            
            if (mimeType.startsWith("image")) {
                const mediaBuffer = await m.quoted.download();
                const tempFilePath = path.join(os.tmpdir(), `goodbye_${Date.now()}.jpg`);
                fs.writeFileSync(tempFilePath, mediaBuffer);

                const form = new FormData();
                form.append("fileToUpload", fs.createReadStream(tempFilePath));
                form.append("reqtype", "fileupload");

                const response = await axios.post("https://catbox.moe/user/api.php", form, {
                    headers: form.getHeaders()
                });

                fs.unlinkSync(tempFilePath);
                
                if (response.data.startsWith('https://')) {
                    config.GOODBYE_IMAGE = response.data;
                    
                    if (msg) {
                        config.GOODBYE_MSG = msg;
                        
                        if (config.MONGODB_URL && botNumber) {
                            await config.updateConfigForNumber(botNumber, { 
                                GOODBYE_IMAGE: response.data,
                                GOODBYE_MSG: msg 
                            });
                        }
                        
                        await reply(`✅ *Goodbye settings updated!*\n\n*Message:* ${msg}\n*Image:* Uploaded successfully`);
                    } else {
                        if (config.MONGODB_URL && botNumber) {
                            await config.updateConfigForNumber(botNumber, { GOODBYE_IMAGE: response.data });
                        }
                        
                        await reply(`✅ *Goodbye image updated!*\n\n*Image:* Uploaded successfully\n*Message:* Keeping previous message`);
                    }
                    return;
                } else {
                    return reply("❌ Failed to upload image to catbox");
                }
            } else {
                return reply("❌ Please reply to an image file (jpg, png, etc)");
            }
        }
        
        // CASE 2: Just text (NO image reply) - THIS REMOVES THE IMAGE
        if (msg) {
            config.GOODBYE_MSG = msg;
            config.GOODBYE_IMAGE = "";
            
            if (config.MONGODB_URL && botNumber) {
                await config.updateConfigForNumber(botNumber, { 
                    GOODBYE_MSG: msg,
                    GOODBYE_IMAGE: "" 
                });
            }
            
            await reply(`✅ *Goodbye message set (TEXT ONLY - image removed)*\n\n*New Message:*\n${msg}\n\n*Available placeholders:*\n• @user - Mentions leaving user\n• @group - Group name\n• @desc - Group description\n• @count - Member count\n• @time - Current time\n• @bot - Bot name`);
        } else {
            await reply(`❌ *Please provide a message or reply to an image*\n\n*Examples:*\n• Text only: .setgoodbye Goodbye @user! 👋\n• With image: [reply to image] .setgoodbye Bye @user!\n• Image only: [reply to image] .setgoodbye`);
        }
        
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// MODE
cmd({
  pattern: "mode",
  alias: ["setmode", "mod"],
  react: "✅",
  desc: "Set bot mode to private or public.",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const currentMode = config.MODE || "public";

  if (!args[0]) {
    return reply(`📌 Current mode: *${currentMode}*\n\nUsage: .mode private OR .mode public`);
  }

  const modeArg = args[0].toLowerCase();

  if (["private", "public"].includes(modeArg)) {
    config.MODE = modeArg;
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { MODE: modeArg });
    }
    
    await reply(`✅ Bot mode is now set to *${modeArg.toUpperCase()}*.`);
  } else {
    return reply("❌ Invalid mode. Please use `.mode private` or `.mode public`.");
  }
});

// ANTI-CALL
cmd({
  pattern: "anti-call",
  react: "🫟",
  alias: ["anticall"],
  desc: "Enable or disable anti-call feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.ANTI_CALL = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTI_CALL: "true" });
    }
    
    return reply("*✅ Anti-call has been enabled*");
  } else if (status === "off") {
    config.ANTI_CALL = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTI_CALL: "false" });
    }
    
    return reply("*❌ Anti-call has been disabled*");
  } else {
    return reply(`*Example: anti-call on/off*`);
  }
});

// ANTI-STATUS-MENTION
cmd({
  pattern: "antistatus",
  react: "🚫",
  alias: ["anti-status", "anti-status-mention"],
  desc: "Enable or disable anti-status-mention feature in groups\nModes: on/off/warn/delete",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  try {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
      config.ANTI_STATUS_MENTION = "true";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_STATUS_MENTION: "true" });
      }
      
      await reply("🚫 *Anti-status-mention feature is now ENABLED*\n\nStatus mentions will be automatically deleted.");
    } else if (args[0] === "off") {
      config.ANTI_STATUS_MENTION = "false";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_STATUS_MENTION: "false" });
      }
      
      await reply("🚫 *Anti-status-mention feature is now DISABLED*\n\nStatus mentions will be allowed.");
    } else if (args[0] === "warn") {
      config.ANTI_STATUS_MENTION = "warn";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_STATUS_MENTION: "warn" });
      }
      
      await reply("⚠️ *Anti-status-mention feature is set to WARN mode*\n\nUsers will be warned when sending status mentions.");
    } else if (args[0] === "delete") {
      config.ANTI_STATUS_MENTION = "delete";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_STATUS_MENTION: "delete" });
      }
      
      await reply("🗑️ *Anti-status-mention feature is set to DELETE mode*\n\nStatus mentions will be automatically deleted.");
    } else {
      await reply(`*Invalid input! Use one of the following modes:*\n\n• *on* - Enable anti-status-mention (delete mentions)\n• *off* - Disable anti-status-mention\n• *warn* - Warn users when sending status mentions\n• *delete* - Delete status mentions automatically\n\n*Example:* .antistatus warn`);
    }
  } catch (error) {
    return reply(`*Error:* ${error.message}`);
  }
});

// AUTO STATUS REACT
cmd({
  pattern: "statuslike",
  alias: ["status-react", "statusreact", "sreact"],
  react: "🫟",
  desc: "Enable or disable auto-reacting to statuses",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_LIKE_STATUS = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_LIKE_STATUS: "true" });
    }
    
    return reply("Autoreact of statuses is now enabled.");
  } else if (status === "off") {
    config.AUTO_LIKE_STATUS = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_LIKE_STATUS: "false" });
    }
    
    return reply("Autoreact of statuses is now disabled.");
  } else {
    return reply(`*Example: .statuslike on*`);
  }
});

// AUTO STATUS VIEW
cmd({
  pattern: "autostatusview",
  alias: ["status-view", "sview", "statusview"],
  desc: "Enable or disable auto-viewing of statuses",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_STATUS_SEEN = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_STATUS_SEEN: "true" });
    }
    
    return reply("Autoview of statuses is now enabled.");
  } else if (status === "off") {
    config.AUTO_STATUS_SEEN = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_STATUS_SEEN: "false" });
    }
    
    return reply("Autoview of statuses is now disabled.");
  } else {
    return reply(`Example: .autostatusview on`);
  }
});

// READ MESSAGE
cmd({
  pattern: "read-message",
  alias: ["autoread"],
  desc: "Enable or disable read message feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.READ_MESSAGE = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { READ_MESSAGE: "true" });
    }
    
    return reply("Read message feature is now enabled.");
  } else if (status === "off") {
    config.READ_MESSAGE = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { READ_MESSAGE: "false" });
    }
    
    return reply("Read message feature is now disabled.");
  } else {
    return reply(`_example: .read-message on_`);
  }
});

// ANTI BAD ON/OFF
cmd({
    pattern: "antibat",
    alias: ["antibad", "anti-bad"],
    desc: "Enable/disable anti-bad word feature",
    category: "setting",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const status = args[0]?.toLowerCase();
        
        if (status === "on") {
            config.ANTI_BAD_WORD = "true";
            
            if (config.MONGODB_URL && botNumber) {
                await config.updateConfigForNumber(botNumber, { ANTI_BAD_WORD: "true" });
            }
            
            reply("✅ *Anti-bad word is now ENABLED*");
        } 
        else if (status === "off") {
            config.ANTI_BAD_WORD = "false";
            
            if (config.MONGODB_URL && botNumber) {
                await config.updateConfigForNumber(botNumber, { ANTI_BAD_WORD: "false" });
            }
            
            reply("❌ *Anti-bad word is now DISABLED*");
        }
        else if (status === "warn") {
            config.ANTI_BAD_WORD = "warn";
            
            if (config.MONGODB_URL && botNumber) {
                await config.updateConfigForNumber(botNumber, { ANTI_BAD_WORD: "warn" });
            }
            
            reply("⚠️ *Anti-bad word is now in WARN mode (3 warnings then kick)*");
        }
        else if (status === "delete") {
            config.ANTI_BAD_WORD = "delete";
            
            if (config.MONGODB_URL && botNumber) {
                await config.updateConfigForNumber(botNumber, { ANTI_BAD_WORD: "delete" });
            }
            
            reply("🗑️ *Anti-bad word is now in DELETE mode (delete only)*");
        }
        else {
            const current = config.ANTI_BAD_WORD || "false";
            reply(`*Current mode:* ${current}\n\n*Options:* on, off, warn, delete\n\n*Example:* .antibat warn`);
        }

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ADD BAD WORD
cmd({
    pattern: "addbadword",
    alias: ["addbad", "addblockword"],
    desc: "Add a word to bad words list",
    category: "setting",
    react: "➕",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
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

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { BAD_WORDS: badWords });
        }

        await reply(`✅ *Added "${word}" to bad words list*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// REMOVE BAD WORD
cmd({
    pattern: "removebadword",
    alias: ["delbadword", "rmbadword"],
    desc: "Remove a word from bad words list",
    category: "setting",
    react: "➖",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
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

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { BAD_WORDS: badWords });
        }

        await reply(`✅ *Removed "${word}" from bad words list*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// LIST BAD WORDS
cmd({
    pattern: "listbadword",
    alias: ["badwords", "badwordlist"],
    desc: "Show list of bad words",
    category: "setting",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let badWords = Array.isArray(config.BAD_WORDS) ? config.BAD_WORDS : [];

        if (badWords.length === 0) {
            return reply("📋 *No bad words in the list*");
        }

        let text = "╭─〔 🚫 *BAD WORDS LIST* 〕\n";
        badWords.forEach((word, index) => {
            text += `├─ ${index + 1}. ${word}\n`;
        });
        text += "╰─────────────────";

        reply(text);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// BAD WORD WARNINGS LIST
cmd({
    pattern: "badwarns",
    alias: ["badwordwarns", "badwarnings"],
    desc: "Show list of users with bad word warnings",
    category: "setting",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let warnings = getBadWordWarnings();

        if (warnings.length === 0) {
            return reply("✅ *No users with bad word warnings*");
        }

        let text = "╭─〔 🚫 *BAD WORD WARNINGS* 〕\n";
        warnings.forEach((item, index) => {
            let [num, count] = item.split('-');
            let number = num.split('@')[0];
            text += `├─ ${index + 1}. ${number} (${count}/3)\n`;
        });
        text += "╰─────────────────";

        reply(text);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// RESET ALL WARNINGS
cmd({
    pattern: "resetwarns",
    alias: ["resetallwarns", "clearallwarns"],
    desc: "Reset all link warnings",
    category: "setting",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        saveLinkWarnings([]);

        await reply("✅ *All link warnings have been reset*");

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// WARN USER (Add to link warnings)
cmd({
    pattern: "warn",
    alias: ["addwarn", "warning"],
    desc: "Add a warning to a user (links)",
    category: "setting",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

        if (!target && args[0]) {
            const cleanedNumber = args[0].replace(/[^0-9]/g, '');
            if (cleanedNumber && cleanedNumber.length >= 10) {
                target = cleanedNumber + "@s.whatsapp.net";
            }
        }

        if (!target || !isValidNumber(target)) {
            return reply("⚠️ Please provide a user to warn!\n\n*Usage:* `.warn @user` or `.warn 92342758****` or reply to a message");
        }

        target = await getTargetJid(conn, target);
        if (!target) return reply("❌ Invalid target format.");

        let warnCount = addLinkWarning(target);
        const number = extractNumber(target);

        await reply(`✅ *Warning added to ${number}*\n*Total warnings:* ${warnCount}/3`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// LINK WARNINGS LIST
cmd({
    pattern: "warnlist",
    alias: ["linkwarns", "warnings"],
    desc: "Show list of users with link warnings",
    category: "setting",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let warnings = getLinkWarnings();

        if (warnings.length === 0) {
            return reply("✅ *No users with link warnings*");
        }

        let text = "╭─〔 ⚠️ *LINK WARNINGS* 〕\n";
        warnings.forEach((item, index) => {
            let [num, count] = item.split('-');
            let number = num.split('@')[0];
            text += `├─ ${index + 1}. ${number} (${count}/3)\n`;
        });
        text += "╰─────────────────";

        reply(text);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// REMOVE WARNING
cmd({
    pattern: "restwarn",
    alias: ["removewarn", "rmwarn", "clearwarn"],
    desc: "Remove warnings from a specific user",
    category: "setting",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        let target = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);

        if (!target && args[0]) {
            const cleanedNumber = args[0].replace(/[^0-9]/g, '');
            if (cleanedNumber && cleanedNumber.length >= 10) {
                target = cleanedNumber + "@s.whatsapp.net";
            }
        }

        if (!target || !isValidNumber(target)) {
            return reply("⚠️ Please provide a user to remove warnings!\n\n*Usage:* `.restwarn @user` or `.restwarn 92342758****` or reply to a message");
        }

        target = await getTargetJid(conn, target);
        if (!target) return reply("❌ Invalid target format.");

        removeLinkWarning(target);
        const number = extractNumber(target);

        await reply(`✅ *Warnings removed for ${number}*`);

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// AUTO-STICKER
cmd({
  pattern: "autosticker",
  alias: ["auto-sticker"],
  react: "🫟",
  desc: "Enable or disable auto-sticker feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_STICKER = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_STICKER: "true" });
    }
    
    return reply("Auto-sticker feature is now enabled.");
  } else if (status === "off") {
    config.AUTO_STICKER = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_STICKER: "false" });
    }
    
    return reply("Auto-sticker feature is now disabled.");
  } else {
    return reply(`_example: .autosticker on_`);
  }
});

// AUTO-REPLY
cmd({
  pattern: "autoreply",
  alias: ["auto-reply"],
  react: "🫟",
  desc: "Enable or disable auto-reply feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_REPLY = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_REPLY: "true" });
    }
    
    return reply("*Auto-reply is now enabled.*");
  } else if (status === "off") {
    config.AUTO_REPLY = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_REPLY: "false" });
    }
    
    return reply("Auto-reply feature is now disabled.");
  } else {
    return reply(`*Example: .autoreply on*`);
  }
});

// AUTO-REACT
cmd({
  pattern: "autoreact",
  alias: ["auto-react"],
  react: "🫟",
  desc: "Enable or disable the autoreact feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_REACT = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_REACT: "true" });
    }
    
    await reply("Autoreact feature is now enabled.");
  } else if (status === "off") {
    config.AUTO_REACT = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_REACT: "false" });
    }
    
    await reply("Autoreact feature is now disabled.");
  } else {
    await reply(`*Example: .autoreact on*`);
  }
});

// AUTO STATUS REPLY
cmd({
  pattern: "autostatusreply",
  react: "🫟",
  alias: ["statusreply", "status-reply"],
  desc: "Enable or disable status-reply feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.AUTO_STATUS_REPLY = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_STATUS_REPLY: "true" });
    }
    
    return reply("Status-reply feature is now enabled.");
  } else if (status === "off") {
    config.AUTO_STATUS_REPLY = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_STATUS_REPLY: "false" });
    }
    
    return reply("Status-reply feature is now disabled.");
  } else {
    return reply(`*Example: .autostatusreply on*`);
  }
});

// ANTI-BOT
cmd({
  pattern: "antibot",
  react: "🫟",
  alias: ["anti-bot"],
  desc: "Enable or disable anti-bot feature in groups",
  category: "setting",
  react: "🚫",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  try {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
      config.ANTI_BOT = "true";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_BOT: "true" });
      }
      
      await reply("ANTI_BOT feature is now enabled in this group.");
    } else if (args[0] === "off") {
      config.ANTI_BOT = "false";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_BOT: "false" });
      }
      
      await reply("ANTI_BOT feature is now disabled in this group.");
    } else {
      await reply(`*Invalid input! Use either 'on' or 'off'. Example: .antibot on*`);
    }
  } catch (error) {
    return reply(`*Error:* ${error.message}`);
  }
});

// MENTION REPLY
cmd({
  pattern: "mention-reply",
  alias: ["mention"],
  desc: "Enable or disable mention reply feature",
  react: "🔗",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.MENTION_REPLY = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { MENTION_REPLY: "true" });
    }
    
    return reply("Mention Reply feature is now enabled.");
  } else if (status === "off") {
    config.MENTION_REPLY = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { MENTION_REPLY: "false" });
    }
    
    return reply("Mention Reply feature is now disabled.");
  } else {
    return reply(`_example: .mention on_`);
  }
});

// ADMIN EVENTS
cmd({
  pattern: "admin-events",
  alias: ["adminevents", "adminaction"],
  desc: "Enable or disable admin event notifications",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.ADMIN_ACTION = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ADMIN_ACTION: "true" });
    }
    
    return reply("✅ Admin event notifications are now enabled.");
  } else if (status === "off") {
    config.ADMIN_ACTION = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ADMIN_ACTION: "false" });
    }
    
    return reply("❌ Admin event notifications are now disabled.");
  } else {
    return reply(`Example: .admin-events on`);
  }
});

// OWNER REACT
cmd({
  pattern: "ownerreact",
  alias: ["owner-react", "selfreact", "self-react"],
  react: "👑",
  desc: "Enable or disable the owner react feature",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  if (status === "on") {
    config.OWNER_REACT = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { OWNER_REACT: "true" });
    }
    
    await reply("Owner react feature is now enabled.");
  } else if (status === "off") {
    config.OWNER_REACT = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { OWNER_REACT: "false" });
    }
    
    await reply("Owner react feature is now disabled.");
  } else {
    await reply(`*Example: .ownerreact on*`);
  }
});

// AUTO-TYPING
cmd({
  pattern: "autotyping",
  alias: ["auto-typing", "typing"],
  react: "⌨️",
  desc: "Enable auto-typing presence for the bot",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.AUTO_TYPING = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_TYPING: "true" });
    }
    
    return reply("⌨️ *Auto-typing is now ENABLED for both inbox and groups*");
  } else if (status === "ib") {
    config.AUTO_TYPING = "inbox";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_TYPING: "inbox" });
    }
    
    return reply("⌨️ *Auto-typing is now ENABLED for inbox only*");
  } else if (status === "gc") {
    config.AUTO_TYPING = "group";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_TYPING: "group" });
    }
    
    return reply("⌨️ *Auto-typing is now ENABLED for groups only*");
  } else if (status === "off") {
    config.AUTO_TYPING = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_TYPING: "false" });
    }
    
    return reply("⌨️ *Auto-typing is now DISABLED*");
  } else {
    return reply(`*⌨️ Auto-typing Command*\n\n• *on* - Enable for both\n• *ib* - Enable for inbox only\n• *gc* - Enable for groups only\n• *off* - Disable\n\n*Example:* .autotyping on`);
  }
});

// ALWAYS ONLINE
cmd({
  pattern: "alwaysonline",
  alias: ["online", "always-online"],
  react: "🟢",
  desc: "Enable always online presence for the bot",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.ALWAYS_ONLINE = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ALWAYS_ONLINE: "true" });
    }
    
    return reply("🟢 *Always online is now ENABLED*");
  } else if (status === "off") {
    config.ALWAYS_ONLINE = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ALWAYS_ONLINE: "false" });
    }
    
    return reply("🟢 *Always online is now DISABLED*");
  } else {
    return reply(`*🟢 Always Online Command*\n\n• *on* - Enable\n• *off* - Disable\n\n*Example:* .alwaysonline on`);
  }
});

// AUTO RECORDING
cmd({
  pattern: "autorecording",
  alias: ["recording", "auto-recording"],
  react: "🎙️",
  desc: "Enable auto-recording presence for the bot",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const status = args[0]?.toLowerCase();
  
  if (status === "on") {
    config.AUTO_RECORDING = "true";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_RECORDING: "true" });
    }
    
    return reply("🎙️ *Auto-recording is now ENABLED for both inbox and groups*");
  } else if (status === "ib") {
    config.AUTO_RECORDING = "inbox";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_RECORDING: "inbox" });
    }
    
    return reply("🎙️ *Auto-recording is now ENABLED for inbox only*");
  } else if (status === "gc") {
    config.AUTO_RECORDING = "group";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_RECORDING: "group" });
    }
    
    return reply("🎙️ *Auto-recording is now ENABLED for groups only*");
  } else if (status === "off") {
    config.AUTO_RECORDING = "false";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { AUTO_RECORDING: "false" });
    }
    
    return reply("🎙️ *Auto-recording is now DISABLED*");
  } else {
    return reply(`*🎙️ Auto-recording Command*\n\n• *on* - Enable for both\n• *ib* - Enable for inbox only\n• *gc* - Enable for groups only\n• *off* - Disable\n\n*Example:* .autorecording on`);
  }
});

// ANTI DELETE PATH
cmd({
  pattern: "antidelpath",
  alias: ["delpath", "anti-delete-path", "deletepath"],
  react: "🛣️",
  desc: "Configure where to show deleted messages",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply, botNumber }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");

  const option = args[0]?.toLowerCase();
  
  if (option === "ib") {
    config.ANTI_DELETE_PATH = "inbox";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTI_DELETE_PATH: "inbox" });
    }
    
    return reply("🛣️ *Anti-delete path set to INBOX only*\n_Deleted messages will be shown in the same inbox where they were deleted._");
  } else if (option === "same") {
    config.ANTI_DELETE_PATH = "same";
    
    if (config.MONGODB_URL && botNumber) {
        await config.updateConfigForNumber(botNumber, { ANTI_DELETE_PATH: "same" });
    }
    
    return reply("🛣️ *Anti-delete path set to SAME chat*\n_Deleted messages will be shown in the same chat where they were deleted._");
  } else {
    return reply(`*🛣️ Anti-delete Path Command*\n\n• *ib* - Show deleted messages in inbox only\n• *same* - Show deleted messages in same chat\n\n*Example:* .antidelpath ib`);
  }
});

// PRESENCE STATUS
cmd({
  pattern: "presence",
  alias: ["presencestatus", "status"],
  react: "📱",
  desc: "Check the current bot presence status",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
  if (!isCreator) return reply("*📛 Only the owner can use this command!*");
  
  let statusText = "*📱 Bot Presence Status*\n\n";
  
  const alwaysOnline = config.ALWAYS_ONLINE || "false";
  statusText += `🟢 *Always Online:* ${alwaysOnline === "true" ? "ENABLED" : "DISABLED"}\n`;
  
  const autoTyping = config.AUTO_TYPING || "false";
  let typingStatus = "DISABLED";
  if (autoTyping === "true") typingStatus = "ENABLED (both)";
  else if (autoTyping === "inbox") typingStatus = "ENABLED (inbox only)";
  else if (autoTyping === "group") typingStatus = "ENABLED (groups only)";
  statusText += `⌨️ *Auto Typing:* ${typingStatus}\n`;
  
  const autoRecording = config.AUTO_RECORDING || "false";
  let recordingStatus = "DISABLED";
  if (autoRecording === "true") recordingStatus = "ENABLED (both)";
  else if (autoRecording === "inbox") recordingStatus = "ENABLED (inbox only)";
  else if (autoRecording === "group") recordingStatus = "ENABLED (groups only)";
  statusText += `🎙️ *Auto Recording:* ${recordingStatus}\n\n`;
  
  statusText += `*Available Commands:*\n• .autotyping on/ib/gc/off\n• .alwaysonline on/off\n• .autorecording on/ib/gc/off\n• .presence`;
  
  return reply(statusText);
});

// ANTI-LINK
cmd({
  pattern: "antilink",
  alias: ["anti-link"],
  desc: "Enable or disable anti-link feature in groups\nModes: on/off/warn/delete",
  category: "setting",
  react: "🔗",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  try {
    if (!isCreator) return reply("*📛 Only the owner can use this command!*");

    if (args[0] === "on") {
      config.ANTI_LINK = "true";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_LINK: "true" });
      }
      
      await reply("🔗 *Anti-link is now ON*\n\nLinks will be deleted and users removed immediately.");
    } else if (args[0] === "off") {
      config.ANTI_LINK = "false";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_LINK: "false" });
      }
      
      await reply("🔗 *Anti-link is now OFF*\n\nLinks will be allowed.");
    } else if (args[0] === "warn") {
      config.ANTI_LINK = "warn";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_LINK: "warn" });
      }
      
      await reply("⚠️ *Anti-link is now in WARN mode*\n\n1st offense: Warning\n2nd offense: Warning\n3rd offense: User removed");
    } else if (args[0] === "delete") {
      config.ANTI_LINK = "delete";
      
      if (config.MONGODB_URL && botNumber) {
          await config.updateConfigForNumber(botNumber, { ANTI_LINK: "delete" });
      }
      
      const deleteMsg = config.ANTI_LINK_DELETE_MSG || "⚠️ Links Are Not Allowed in Group.\nPlease @user take note.";
      await reply(`🗑️ *Anti-link is now in DELETE mode*\n\nLinks will be deleted only, no removal.\n\n*Message:*\n${deleteMsg}`);
    } else {
      const current = config.ANTI_LINK || "false";
      await reply(`*🔗 Anti-link Settings*\n\n*Current Mode:* ${current}\n\n*Available Modes:*\n• *on* - Delete links & remove user immediately\n• *warn* - 3 warnings then remove\n• *delete* - Delete links only\n• *off* - Disable anti-link\n\n*Example:* .antilink warn\n\n*Message Commands:*\n.setwarnmsg - Set warn message\n.setkickmsg - Set kick message\n.setdelmsg - Set delete message\n.setimmmsg - Set immediate message`);
    }
  } catch (error) {
    return reply(`*Error:* ${error.message}`);
  }
});

// SET ANTI-LINK WARN MESSAGE
cmd({
    pattern: "setwarnmsg",
    alias: ["warnmsg", "setantilinkwarn"],
    react: "⚠️",
    desc: "Set custom warning message for anti-link (1st/2nd offense)",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const msg = args.join(' ').trim();
        if (!msg) {
            return reply(`❌ *Please provide a warning message*\n\n*Example:* .setwarnmsg ⚠️ @user Links are not allowed! Warning (@warn/3)\n\n*Placeholders:*\n• @user - Mentions the user\n• @warn - Current warning count`);
        }

        config.ANTI_LINK_WARN_MSG = msg;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { ANTI_LINK_WARN_MSG: msg });
        }

        await reply(`✅ *Anti-link warn message updated*\n\n*New Message:*\n${msg}`);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// SET ANTI-LINK KICK MESSAGE
cmd({
    pattern: "setkickmsg",
    alias: ["kickmsg", "setantilinkkick"],
    react: "🚨",
    desc: "Set custom kick message for anti-link (3rd offense)",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const msg = args.join(' ').trim();
        if (!msg) {
            return reply(`❌ *Please provide a kick message*\n\n*Example:* .setkickmsg 🚨 @user removed for sharing links after 3 warnings.\n\n*Placeholders:*\n• @user - Mentions the user`);
        }

        config.ANTI_LINK_KICK_MSG = msg;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { ANTI_LINK_KICK_MSG: msg });
        }

        await reply(`✅ *Anti-link kick message updated*\n\n*New Message:*\n${msg}`);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// SET ANTI-LINK DELETE MESSAGE
cmd({
    pattern: "setdelmsg",
    alias: ["delmsg", "setantilinkdelete"],
    react: "🗑️",
    desc: "Set custom delete message for anti-link (delete only mode)",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const msg = args.join(' ').trim();
        if (!msg) {
            return reply(`❌ *Please provide a delete message*\n\n*Example:* .setdelmsg ⚠️ @user Links are not allowed in this group.\n\n*Placeholders:*\n• @user - Mentions the user`);
        }

        config.ANTI_LINK_DELETE_MSG = msg;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { ANTI_LINK_DELETE_MSG: msg });
        }

        await reply(`✅ *Anti-link delete message updated*\n\n*New Message:*\n${msg}`);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// SET ANTI-LINK IMMEDIATE MESSAGE
cmd({
    pattern: "setimmmsg",
    alias: ["immmsg", "setantilinkimmediate"],
    react: "⚡",
    desc: "Set custom immediate removal message for anti-link (true mode)",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const msg = args.join(' ').trim();
        if (!msg) {
            return reply(`❌ *Please provide an immediate removal message*\n\n*Example:* .setimmmsg ⚠️ @user Links are not allowed. User removed.\n\n*Placeholders:*\n• @user - Mentions the user`);
        }

        config.ANTI_LINK_IMMEDIATE_MSG = msg;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, { ANTI_LINK_IMMEDIATE_MSG: msg });
        }

        await reply(`✅ *Anti-link immediate removal message updated*\n\n*New Message:*\n${msg}`);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// VIEW ALL ANTI-LINK MESSAGES
cmd({
    pattern: "antilinkmsgs",
    alias: ["linkmsgs", "antilinkmessages"],
    react: "📋",
    desc: "View all anti-link message templates",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const warnMsg = config.ANTI_LINK_WARN_MSG || "⚠️ WARNING @user – Links are not allowed in this group. Warning issued (@warn/3)";
        const kickMsg = config.ANTI_LINK_KICK_MSG || "🚨 *REMOVED* @user From Group For Sharing Links After 3 Warning.";
        const deleteMsg = config.ANTI_LINK_DELETE_MSG || "⚠️ Links Are Not Allowed in Group.\nPlease @user take note.";
        const immediateMsg = config.ANTI_LINK_IMMEDIATE_MSG || "⚠️ Links Are Not Allowed in Group.\n@user has been removed.";

        let text = "╭─〔 📋 *ANTI-LINK MESSAGES* 〕\n\n";
        text += `*⚠️ WARN MESSAGE:*\n${warnMsg}\n\n`;
        text += `*🚨 KICK MESSAGE:*\n${kickMsg}\n\n`;
        text += `*🗑️ DELETE MESSAGE:*\n${deleteMsg}\n\n`;
        text += `*⚡ IMMEDIATE MESSAGE:*\n${immediateMsg}\n\n`;
        text += `*Placeholders:*\n• @user - Mentions user\n• @warn - Warning count (warn mode only)\n\n`;
        text += `*Commands:*\n• .setwarnmsg - Set warn message\n• .setkickmsg - Set kick message\n• .setdelmsg - Set delete message\n• .setimmmsg - Set immediate message\n╰─────────────────`;

        reply(text);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// RESET ALL ANTI-LINK MESSAGES TO DEFAULT
cmd({
    pattern: "resetlinkmsgs",
    alias: ["resetantilinkmsgs"],
    react: "🔄",
    desc: "Reset all anti-link messages to default",
    category: "setting",
    filename: __filename
}, async (conn, mek, m, { isCreator, reply, botNumber }) => {
    try {
        if (!isCreator) return reply("❗ Only the bot owner can use this command.");

        const defaults = {
            ANTI_LINK_WARN_MSG: "⚠️ WARNING @user – Links are not allowed in this group. Warning issued (@warn/3)",
            ANTI_LINK_KICK_MSG: "🚨 *REMOVED* @user From Group For Sharing Links After 3 Warning.",
            ANTI_LINK_DELETE_MSG: "⚠️ Links Are Not Allowed in Group.\nPlease @user take note.",
            ANTI_LINK_IMMEDIATE_MSG: "⚠️ Links Are Not Allowed in Group.\n@user has been removed."
        };

        config.ANTI_LINK_WARN_MSG = defaults.ANTI_LINK_WARN_MSG;
        config.ANTI_LINK_KICK_MSG = defaults.ANTI_LINK_KICK_MSG;
        config.ANTI_LINK_DELETE_MSG = defaults.ANTI_LINK_DELETE_MSG;
        config.ANTI_LINK_IMMEDIATE_MSG = defaults.ANTI_LINK_IMMEDIATE_MSG;

        if (config.MONGODB_URL && botNumber) {
            await config.updateConfigForNumber(botNumber, defaults);
        }

        await reply("✅ *All anti-link messages have been reset to default*");
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== HELP/SETTINGS GUIDE COMMAND ====================
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
        guideText += `├─ *Set Bot Name:* .setbotname KHAN-MD\n`;
        guideText += `├─ *Set Owner Name:* .setownername JawadTech\n`;
        guideText += `├─ *Set Prefix:* .setprefix .\n`;
        guideText += `├─ *Set Mode:* .mode public / .mode private\n`;
        guideText += `├─ *Set Bot Image:* .botdp (reply to image)\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 🛡️ *ANTI FEATURES* 〕\n`;
        guideText += `├─ *Anti-Call:* .anti-call on / off\n`;
        guideText += `├─ *Anti-Delete:* .antidelete on / off\n`;
        guideText += `├─ *Anti-Link:* .antilink on / off / warn / delete\n`;
        guideText += `├─ *Anti-Bad Word:* .antibat on / off / warn / delete\n`;
        guideText += `├─ *Anti-Bot:* .antibot on / off\n`;
        guideText += `├─ *Anti-Status:* .antistatus on / off / warn / delete\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 👑 *OWNER & SUDO* 〕\n`;
        guideText += `├─ *Ban User:* .ban @user\n`;
        guideText += `├─ *Unban User:* .unban @user\n`;
        guideText += `├─ *Ban List:* .banlist\n`;
        guideText += `├─ *Add Sudo:* .addsudo @user\n`;
        guideText += `├─ *Remove Sudo:* .delsudo @user\n`;
        guideText += `├─ *Sudo List:* .sudolist\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 👋 *WELCOME/GOODBYE* 〕\n`;
        guideText += `├─ *Welcome:* .welcome on / off\n`;
        guideText += `├─ *Goodbye:* .goodbye on / off\n`;
        guideText += `├─ *Set Welcome Msg:* .setwelcome Your message\n`;
        guideText += `├─ *Set Goodbye Msg:* .setgoodbye Your message\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 😊 *REACTIONS* 〕\n`;
        guideText += `├─ *Auto React:* .autoreact on / off\n`;
        guideText += `├─ *Owner React:* .ownerreact on / off\n`;
        guideText += `├─ *Status React:* .statuslike on / off\n`;
        guideText += `├─ *Status View:* .autostatusview on / off\n`;
        guideText += `├─ *Set React Emojis:* .setemojis ❤️,🔥,👍\n`;
        guideText += `├─ *Set Status Emojis:* .statusemojis ❤️,🔥,👍\n`;
        guideText += `├─ *Set Owner Emojis:* .owneremoji 👑,💎,🤖\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 📱 *PRESENCE* 〕\n`;
        guideText += `├─ *Always Online:* .alwaysonline on / off\n`;
        guideText += `├─ *Auto Typing:* .autotyping on / ib / gc / off\n`;
        guideText += `├─ *Auto Recording:* .autorecording on / ib / gc / off\n`;
        guideText += `├─ *Read Message:* .read-message on / off\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 📥 *AUTO FEATURES* 〕\n`;
        guideText += `├─ *Auto Downloader:* .autodl on / ib / gc / owner / off\n`;
        guideText += `├─ *Auto Sticker:* .autosticker on / off\n`;
        guideText += `├─ *Auto Reply:* .autoreply on / off\n`;
        guideText += `├─ *Status Reply:* .autostatusreply on / off\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 🔗 *ANTI-LINK MESSAGES* 〕\n`;
        guideText += `├─ *Set Warn Msg:* .setwarnmsg Your message\n`;
        guideText += `├─ *Set Kick Msg:* .setkickmsg Your message\n`;
        guideText += `├─ *Set Delete Msg:* .setdelmsg Your message\n`;
        guideText += `├─ *Set Immediate Msg:* .setimmmsg Your message\n`;
        guideText += `├─ *View All Msgs:* .antilinkmsgs\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 🚫 *BAD WORDS* 〕\n`;
        guideText += `├─ *Add Bad Word:* .addbadword word\n`;
        guideText += `├─ *Remove Bad Word:* .removebadword word\n`;
        guideText += `├─ *List Bad Words:* .listbadword\n`;
        guideText += `├─ *View Warnings:* .badwarns\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 ⚠️ *WARNINGS* 〕\n`;
        guideText += `├─ *Warn User:* .warn @user\n`;
        guideText += `├─ *Remove Warn:* .restwarn @user\n`;
        guideText += `├─ *Warn List:* .warnlist\n`;
        guideText += `├─ *Reset All:* .resetwarns\n`;
        guideText += `╰─────────────────\n\n`;

        guideText += `╭─〔 ℹ️ *INFO* 〕\n`;
        guideText += `├─ *View Current Values:* .envlist\n`;
        guideText += `├─ *Bot Presence:* .presence\n`;
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
            if (typeof val === 'boolean') return val ? 'true' : 'false';
            if (typeof val === 'string') {
                if (val === 'true') return 'true';
                if (val === 'false') return 'false';
                if (val.startsWith('http')) return 'URL Set';
                if (val.includes('@s.whatsapp.net')) return val.split('@')[0];
                return val;
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
        envText += `├─ *ANTI_LINK:* ${config.ANTI_LINK || 'warn'}\n`;
        envText += `├─ *ANTI_BAD_WORD:* ${config.ANTI_BAD_WORD || 'false'}\n`;
        envText += `├─ *ANTI_BOT:* ${config.ANTI_BOT || 'false'}\n`;
        envText += `├─ *ANTI_STATUS_MENTION:* ${config.ANTI_STATUS_MENTION || 'false'}\n`;
        envText += `├─ *PM_BLOCKER:* ${config.PM_BLOCKER || 'false'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 👑 *OWNER & SUDO* 〕\n`;
        envText += `├─ *OWNER_NUMBER:* ${config.OWNER_NUMBER || '923427582273'}\n`;
        envText += `├─ *DEV:* ${config.DEV || '923427582273'}\n`;
        envText += `├─ *SUDO:* ${formatValue(config.SUDO)}\n`;
        envText += `├─ *BANNED:* ${formatValue(config.BANNED)}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 👋 *WELCOME/GOODBYE* 〕\n`;
        envText += `├─ *WELCOME:* ${config.WELCOME || 'false'}\n`;
        envText += `├─ *GOODBYE:* ${config.GOODBYE || 'false'}\n`;
        envText += `├─ *ADMIN_ACTION:* ${config.ADMIN_ACTION || 'false'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 😊 *REACTIONS* 〕\n`;
        envText += `├─ *AUTO_REACT:* ${config.AUTO_REACT || 'false'}\n`;
        envText += `├─ *OWNER_REACT:* ${config.OWNER_REACT || 'false'}\n`;
        envText += `├─ *AUTO_LIKE_STATUS:* ${config.AUTO_LIKE_STATUS || 'false'}\n`;
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
        envText += `├─ *AUTO_STATUS_REPLY:* ${config.AUTO_STATUS_REPLY || 'false'}\n`;
        envText += `├─ *AUTO_STATUS_MSG:* ${config.AUTO_STATUS_MSG || 'KHAN MD VIEWED YOUR STATUS 🤖'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 🔗 *ANTI-LINK MESSAGES* 〕\n`;
        envText += `├─ *WARN MSG:* ${config.ANTI_LINK_WARN_MSG ? 'Set' : 'Default'}\n`;
        envText += `├─ *KICK MSG:* ${config.ANTI_LINK_KICK_MSG ? 'Set' : 'Default'}\n`;
        envText += `├─ *DELETE MSG:* ${config.ANTI_LINK_DELETE_MSG ? 'Set' : 'Default'}\n`;
        envText += `├─ *IMMEDIATE MSG:* ${config.ANTI_LINK_IMMEDIATE_MSG ? 'Set' : 'Default'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 🚫 *BAD WORDS* 〕\n`;
        envText += `├─ *BAD_WORDS:* ${formatValue(config.BAD_WORDS)}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 🖼️ *MEDIA* 〕\n`;
        envText += `├─ *BOT_MEDIA_URL:* ${config.BOT_MEDIA_URL ? 'Set' : 'Default'}\n`;
        envText += `├─ *MENU_IMAGE_URL:* ${config.MENU_IMAGE_URL ? 'Set' : 'Default'}\n`;
        envText += `├─ *WELCOME_IMAGE:* ${config.WELCOME_IMAGE ? 'Set' : 'Default'}\n`;
        envText += `├─ *GOODBYE_IMAGE:* ${config.GOODBYE_IMAGE ? 'Set' : 'Default'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `╭─〔 ℹ️ *OTHER* 〕\n`;
        envText += `├─ *CHATBOT:* ${config.CHATBOT || 'off'}\n`;
        envText += `├─ *REJECT_MSG:* ${config.REJECT_MSG ? 'Set' : 'Default'}\n`;
        envText += `├─ *TIMEZONE:* ${config.TIMEZONE || 'Asia/Karachi'}\n`;
        envText += `╰─────────────────\n\n`;

        envText += `> Use .settings to see how to change these values`;

        await reply(envText);
    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// SET BOT DESCRIPTION
cmd({
  pattern: "setdescription",
  alias: ["setdesc", "description", "botdesc"],
  react: "📝",
  desc: "Set the bot's description message",
  category: "setting",
  filename: __filename
}, async (conn, mek, m, { args, isCreator, reply, botNumber }) => {
  try {
    if (!isCreator) return reply("*📛 Only the bot owner can use this command!*");

    const newDescription = args.join(' ').trim();
    if (!newDescription) {
      return reply(`❌ *Please provide a description*\n\n*Example:* .setdescription ⚡ Powered by JawadTechX\n\n*Current:* ${config.DESCRIPTION || 'Not set'}`);
    }

    // Update config
    config.DESCRIPTION = newDescription;

    // Save to MongoDB
    if (config.MONGODB_URL && botNumber) {
      await config.updateConfigForNumber(botNumber, { DESCRIPTION: newDescription });
      console.log(`✅ Description saved to MongoDB for ${botNumber}`);
    }

    await reply(`✅ *Bot description updated successfully!*\n\n*New Description:*\n${newDescription}`);

  } catch (error) {
    console.error('Error in setdescription command:', error);
    reply(`❌ Error: ${error.message}`);
  }
});
