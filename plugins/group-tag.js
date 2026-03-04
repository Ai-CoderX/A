const { cmd } = require('../command');

cmd({
  pattern: "hidetag",
  alias: ["tag", "h"],
  react: "🔊",
  desc: "Tag all members - Creator (new message) | Admins (reply to command)",
  category: "group",
  use: '.tag Hello or reply to media',
  filename: __filename
},
async (conn, mek, m, {
  from, q, isGroup, isCreator, isAdmins,
  participants, reply
}) => {
  try {
    if (!isGroup) return reply("❌ This command can only be used in groups.");
    if (!isAdmins && !isCreator) return reply("❌ Only group admins or creator can use this command.");

    // Check if there's content to send
    if (!q && !m.quoted) {
      return reply("❌ Please provide a message or reply to media.");
    }

    // Send loading reaction
    await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
    
    // Get all group members for mention
    const groupMetadata = await conn.groupMetadata(from);
    const participants = groupMetadata.participants;
    const mentionedJid = participants.map(p => p.id);
    
    // Add mentions to context
    const contextInfo = {
      mentionedJid: mentionedJid,
      isForwarded: false
    };
    
    let messageContent = {};

    // If there's a quoted message (media or text)
    if (m.quoted) {
      const quotedMsg = m.quoted;
      const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
      // If user provided text with command, use that as caption, otherwise use original caption
      const caption = q || quotedMsg.text || "";
      
      // If it's a text message (no media)
      if (!mimeType) {
        messageContent = {
          text: caption || "📢 Tag all members",
          contextInfo: contextInfo
        };
      }
      // Handle media messages
      else if (mimeType.startsWith('image/')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download image");
        
        messageContent = {
          image: buffer,
          caption: caption,
          mimetype: mimeType,
          contextInfo: contextInfo
        };
      }
      else if (mimeType.startsWith('video/')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download video");
        
        messageContent = {
          video: buffer,
          caption: caption,
          mimetype: mimeType,
          contextInfo: contextInfo
        };
      }
      else if (mimeType.startsWith('audio/')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download audio");
        
        const isPTT = quotedMsg.message?.audioMessage?.ptt || false;
        
        messageContent = {
          audio: buffer,
          mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
          ptt: isPTT,
          contextInfo: contextInfo
        };
      }
      else if (mimeType.includes('sticker')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download sticker");
        
        messageContent = {
          sticker: buffer,
          contextInfo: contextInfo
        };
      }
      else {
        // Fallback to text
        messageContent = {
          text: caption || "📢 Tag all members",
          contextInfo: contextInfo
        };
      }
    }
    // If only text is provided (no quoted message)
    else if (q) {
      messageContent = {
        text: q,
        contextInfo: contextInfo
      };
    }

    // Decide whether to quote the command message or not
    // Creator: Send as NEW message (no quoted)
    // Admin: Send as REPLY to command (with quoted)
    const quotedOption = isCreator ? null : { quoted: mek };

    // Send the message with mentions
    await conn.sendMessage(from, messageContent, quotedOption);
    
    // Success reaction
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error("Tag Error:", e);
    reply(`❌ Error: ${e.message}`);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
