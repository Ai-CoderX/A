const { cmd } = require('../command');

cmd({
    pattern: "groupstatus",
    alias: ["statusgc", "gcstatus", "swgc"],
    desc: "Post group status with media or text (mentions all members)",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator, isGroup, participants }) => {
    // Check if user is owner
    if (!isCreator) return reply("❌ This command is only for owners!");
    
    // Check if in group
    if (!isGroup) return reply("❌ This command can only be used in groups!");
    
    try {
        const q = m.quoted ? m.quoted : m;
        const mtype = Object.keys(q.message || {})[0];
        const mimetype = (q.msg || q).mimetype || '';
        const caption = text?.trim() || "";
        
        // Check if there's content to send
        if (!mtype && !caption && !m.quoted) {
            return reply(
                `⚠️ Reply to media or provide text!\n\n` +
                `Example: ${cmd.pattern} Hello everyone`
            );
        }
        
        // Send loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // Get all group members for mention
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants;
        
        // Create mention object with all members
        const mentionAll = { 
            mentions: participants.map(p => p.id) 
        };
        
        let messageContent = {};
        
        // If there's quoted media
        if (m.quoted) {
            const buffer = await m.quoted.download();
            if (!buffer) throw new Error("Failed to download media");
            
            // Add status context with mentions
            const contextInfo = {
                isGroupStatus: true,
                mentionedJid: participants.map(p => p.id) // All members mentioned
            };
            
            // Handle different media types
            switch (mtype) {
                case "imageMessage":
                    messageContent = {
                        image: buffer,
                        caption: caption || "",
                        mimetype: mimetype || "image/jpeg",
                        contextInfo: contextInfo
                    };
                    break;
                    
                case "videoMessage":
                    messageContent = {
                        video: buffer,
                        caption: caption || "",
                        mimetype: mimetype || "video/mp4",
                        contextInfo: contextInfo
                    };
                    break;
                    
                case "audioMessage":
                case "pttMessage":
                    messageContent = {
                        audio: buffer,
                        mimetype: "audio/mp4",
                        ptt: mtype === "pttMessage",
                        contextInfo: contextInfo
                    };
                    break;
                    
                default:
                    return reply("❌ Unsupported media type!");
            }
        } 
        // If only text
        else if (caption) {
            messageContent = {
                text: caption,
                contextInfo: {
                    isGroupStatus: true,
                    mentionedJid: participants.map(p => p.id) // All members mentioned
                }
            };
        } else {
            return reply("❌ No content to send!");
        }
        
        // Send the status with mentions
        await conn.sendMessage(from, messageContent, { quoted: mek });
        
        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
    } catch (error) {
        console.error("Group Status Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
