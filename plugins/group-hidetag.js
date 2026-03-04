const { cmd } = require('../command');
const converter = require('../lib/converter'); // Add for audio conversion

// ============== .tag COMMAND (Admins + Creator) ==============
cmd({
  pattern: "tag",
  alias: ["tagmembers"],
  react: "🔊",
  desc: "Tag all members (Admins & Creator) - Replies to command message",
  category: "group",
  use: '.tag [reply to message]',
  filename: __filename
},
async (conn, mek, m, {
  from, q, isGroup, isCreator, isAdmins,
  participants, reply
}) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins && !isCreator) return reply("❌ Only group admins can use this command.");

    // Check if there's a quoted message
    if (!m.quoted) {
      return reply("❌ Please reply to a message to tag all members.");
    }

    const quotedMsg = m.quoted;
    const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
    const caption = quotedMsg.text || q || "";
    
    // Send loading reaction
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    
    // Get all group members for mention
    const groupMetadata = await conn.groupMetadata(from);
    const participants = groupMetadata.participants;
    const mentionedJid = participants.map(p => p.id);
    
    let messageContent = {};

    // If it's a text message
    if (!mimeType) {
      messageContent = {
        text: caption || "📢 Tag all members",
        mentions: mentionedJid
      };
    }
    // Handle media messages
    else if (mimeType.startsWith('image/')) {
      const buffer = await quotedMsg.download();
      if (!buffer) throw new Error("Failed to download image");
      
      messageContent = {
        image: buffer,
        caption: caption || "",
        mimetype: mimeType,
        mentions: mentionedJid
      };
    }
    else if (mimeType.startsWith('video/')) {
      const buffer = await quotedMsg.download();
      if (!buffer) throw new Error("Failed to download video");
      
      const isGif = quotedMsg.message?.videoMessage?.gifPlayback || false;
      
      messageContent = {
        video: buffer,
        caption: caption || "",
        gifPlayback: isGif,
        mimetype: mimeType,
        mentions: mentionedJid
      };
    }
    else if (mimeType.startsWith('audio/')) {
      const buffer = await quotedMsg.download();
      if (!buffer) throw new Error("Failed to download audio");
      
      const isPTT = quotedMsg.message?.audioMessage?.ptt || false;
      
      // Convert audio using converter (like status command)
      let audioToSend = buffer;
      let audioMime = 'audio/mp4';
      
      if (isPTT) {
        // Convert to proper voice note format
        audioToSend = await converter.toPTT(buffer, 'mp3');
        audioMime = 'audio/ogg; codecs=opus';
      }
      
      messageContent = {
        audio: audioToSend,
        mimetype: audioMime,
        ptt: isPTT,
        mentions: mentionedJid
      };
    }
    else if (mimeType.includes('sticker')) {
      const buffer = await quotedMsg.download();
      if (!buffer) throw new Error("Failed to download sticker");
      
      messageContent = {
        sticker: buffer,
        mentions: mentionedJid
      };
    }
    else if (mimeType.includes('document')) {
      const buffer = await quotedMsg.download();
      if (!buffer) throw new Error("Failed to download document");
      
      const fileName = quotedMsg.message?.documentMessage?.fileName || "document";
      const docMime = quotedMsg.message?.documentMessage?.mimetype || "application/octet-stream";
      
      messageContent = {
        document: buffer,
        mimetype: docMime,
        fileName: fileName,
        caption: caption || "",
        mentions: mentionedJid
      };
    }
    else {
      // Fallback to text
      messageContent = {
        text: caption || "📢 Tag all members",
        mentions: mentionedJid
      };
    }

    // Send as REPLY to command message
    await conn.sendMessage(from, messageContent, { quoted: mek });
    
    // Success reaction
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error("Tag Error:", e);
    reply(`❌ Error: ${e.message}`);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});

// ============== .h / .hidetag COMMAND (Creator Only) ==============
cmd({
  pattern: "hidetag",
  alias: ["h"],
  react: "🔇",
  desc: "Hidden tag with custom message (Creator only) - Sends new message",
  category: "owner",
  use: '.h Hello everyone',
  filename: __filename
},
async (conn, mek, m, {
  from, q, isGroup, isCreator,
  participants, reply
}) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isCreator) return reply("❌ Only the bot creator can use this command.");

    // Check if there's text or quoted message
    if (!q && !m.quoted) {
      return reply("❌ Please provide a message or reply to media.");
    }

    // Send loading reaction
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    
    // Get all group members for mention
    const groupMetadata = await conn.groupMetadata(from);
    const participants = groupMetadata.participants;
    const mentionedJid = participants.map(p => p.id);
    
    let messageContent = {};

    // If there's a quoted message (media)
    if (m.quoted) {
      const quotedMsg = m.quoted;
      const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
      const caption = q || quotedMsg.text || "";
      
      // If it's a text message
      if (!mimeType) {
        messageContent = {
          text: caption || "📢 Hidden tag",
          mentions: mentionedJid
        };
      }
      // Handle media messages
      else if (mimeType.startsWith('image/')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download image");
        
        messageContent = {
          image: buffer,
          caption: caption || "",
          mimetype: mimeType,
          mentions: mentionedJid
        };
      }
      else if (mimeType.startsWith('video/')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download video");
        
        messageContent = {
          video: buffer,
          caption: caption || "",
          mimetype: mimeType,
          mentions: mentionedJid
        };
      }
      else if (mimeType.startsWith('audio/')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download audio");
        
        const isPTT = quotedMsg.message?.audioMessage?.ptt || false;
        
        // Convert audio using converter (like status command)
        let audioToSend = buffer;
        let audioMime = 'audio/mp4';
        
        if (isPTT) {
          // Convert to proper voice note format
          audioToSend = await converter.toPTT(buffer, 'mp3');
          audioMime = 'audio/ogg; codecs=opus';
        }
        
        messageContent = {
          audio: audioToSend,
          mimetype: audioMime,
          ptt: isPTT,
          mentions: mentionedJid
        };
      }
      else if (mimeType.includes('sticker')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download sticker");
        
        messageContent = {
          sticker: buffer,
          mentions: mentionedJid
        };
      }
      else {
        // Fallback to text
        messageContent = {
          text: caption || "📢 Hidden tag",
          mentions: mentionedJid
        };
      }
    }
    // If only text is provided
    else if (q) {
      messageContent = {
        text: q,
        mentions: mentionedJid
      };
    }

    // Send as NEW MESSAGE (no quoted)
    await conn.sendMessage(from, messageContent);
    
    // Success reaction
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error("Hidden Tag Error:", e);
    reply(`❌ Error: ${e.message}`);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
