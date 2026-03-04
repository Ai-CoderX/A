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
  participants, reply  // participants is already available from destructuring
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
    
    // Use participants directly from destructuring (like your original tag command)
    const mentionedJid = participants.map(p => p.id);
    
    // Create mention object (like your original tag command)
    const mentionAll = { mentions: mentionedJid };
    
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
          ...mentionAll
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
          ...mentionAll
        };
      }
      else if (mimeType.startsWith('video/')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download video");
        
        messageContent = {
          video: buffer,
          caption: caption,
          mimetype: mimeType,
          ...mentionAll
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
          ...mentionAll
        };
      }
      else if (mimeType.includes('sticker')) {
        const buffer = await quotedMsg.download();
        if (!buffer) throw new Error("Failed to download sticker");
        
        messageContent = {
          sticker: buffer,
          ...mentionAll
        };
      }
      else {
        // Fallback to text
        messageContent = {
          text: caption || "📢 Tag all members",
          ...mentionAll
        };
      }
    }
    // If only text is provided (no quoted message)
    else if (q) {
      messageContent = {
        text: q,
        ...mentionAll
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
