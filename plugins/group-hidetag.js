const { cmd } = require('../command');

cmd({
  pattern: "hidetag",
  alias: ["tag", "taghide", "h"],  
  react: "🔊",
  desc: "Tag all members - Creator (new message) | Admins (reply to command)",
  category: "group",
  use: '.hidetag Hello or reply to media',
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
    
    // Create mention object with all participants
    const mentionAll = { mentions: participants.map(u => u.id) };
    
    // Decide whether to quote the command message or not
    // Creator: Send as NEW message (no quoted)
    // Admin: Send as REPLY to command (with quoted)
    const quotedOption = isCreator ? null : { quoted: mek };

    // If there's a quoted message (reply to media/text)
    if (m.quoted) {
      const quotedMsg = m.quoted;
      const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
      // If user provided text with command, use that as caption
      const caption = q || "";
      
      // If it's a text message (no media)
      if (!mimeType) {
        const textToSend = caption || quotedMsg.text || "📢 Tag all members";
        return await conn.sendMessage(from, {
          text: textToSend,
          ...mentionAll
        }, quotedOption);
      }

      // Handle media messages
      try {
        const buffer = await quotedMsg.download();
        if (!buffer) return reply("❌ Failed to download the quoted media.");

        let content;
        
        // Image
        if (mimeType.startsWith('image/')) {
          content = { 
            image: buffer, 
            caption: caption || quotedMsg.text || "📷 Image", 
            mimetype: mimeType,
            ...mentionAll 
          };
        }
        // Video
        else if (mimeType.startsWith('video/')) {
          content = { 
            video: buffer, 
            caption: caption || quotedMsg.text || "🎥 Video", 
            mimetype: mimeType,
            gifPlayback: quotedMsg.message?.videoMessage?.gifPlayback || false, 
            ...mentionAll 
          };
        }
        // Audio
        else if (mimeType.startsWith('audio/')) {
          const isPTT = quotedMsg.message?.audioMessage?.ptt || false;
          content = { 
            audio: buffer, 
            mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4', 
            ptt: isPTT, 
            ...mentionAll 
          };
        }
        // Sticker
        else if (mimeType.includes('sticker') || mimeType.includes('webp')) {
          content = { 
            sticker: buffer, 
            ...mentionAll 
          };
        }
        // Document
        else if (mimeType.includes('document') || mimeType.includes('pdf') || mimeType.includes('text')) {
          content = {
            document: buffer,
            mimetype: mimeType || "application/octet-stream",
            fileName: quotedMsg.message?.documentMessage?.fileName || "document",
            caption: caption || quotedMsg.text || "",
            ...mentionAll
          };
        }
        // Unknown media type
        else {
          return reply("❌ Unsupported media type!");
        }

        if (content) {
          return await conn.sendMessage(from, content, quotedOption);
        }
      } catch (e) {
        console.error("Media download/send error:", e);
        return reply("❌ Failed to process the media. Error: " + e.message);
      }
    }

    // If no quoted message, but text is provided
    if (q) {
      return await conn.sendMessage(from, {
        text: q,
        ...mentionAll
      }, quotedOption);
    }

  } catch (e) {
    console.error("Tag Error:", e);
    reply(`❌ Error: ${e.message}`);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
