const { cmd } = require('../command');

cmd({
    pattern: "status",
    alias: ["sw", "mystatus", "uploadstatus"],
    desc: "Upload status with media or text",
    category: "owner",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator, sender }) => {
    // Check if user is owner
    if (!isCreator) return reply("❌ This command is only for owners!");
    
    try {
        // Get the quoted message
        const quotedMsg = m.quoted;
        
        // Get mime type properly
        const mimeType = quotedMsg ? (quotedMsg.msg || quotedMsg).mimetype || '' : '';
        
        // Get caption/text
        const caption = text?.trim() || "";
        
        // Check if there's content to send
        if (!quotedMsg && !caption) {
            return reply(
                `⚠️ Reply to media or provide text!\n\n` +
                `Examples:\n` +
                `• .status Hello everyone\n` +
                `• Reply to an image with: .status\n` +
                `• Reply to video/audio with: .status`
            );
        }
        
        // Send loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // Your status broadcast ID (personal status)
        const statusJid = 'status@broadcast';
        
        // Your own JID in the format needed for statusJidList
        const myJid = sender.includes(':') ? sender.split(':')[0] + '@s.whatsapp.net' : sender;
        
        let messageContent = {};
        
        // If there's quoted media
        if (quotedMsg) {
            // Download media
            const mediaBuffer = await quotedMsg.download();
            if (!mediaBuffer) throw new Error("Failed to download media");
            
            // Handle different media types based on mimeType
            if (mimeType.startsWith('image/')) {
                // Image status
                messageContent = {
                    image: mediaBuffer,
                    caption: caption || "",
                    mimetype: mimeType
                };
            } 
            else if (mimeType.startsWith('video/')) {
                // Video status
                messageContent = {
                    video: mediaBuffer,
                    caption: caption || "",
                    mimetype: mimeType
                };
            } 
            else if (mimeType.startsWith('audio/')) {
                // Audio status (voice note)
                const isPTT = quotedMsg.message?.audioMessage?.ptt || false;
                
                messageContent = {
                    audio: mediaBuffer,
                    mimetype: isPTT ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                    ptt: isPTT
                };
            }
            else {
                // Try to detect by message type as fallback
                const msgType = Object.keys(quotedMsg.message || {})[0];
                
                if (msgType === 'imageMessage') {
                    messageContent = {
                        image: mediaBuffer,
                        caption: caption || "",
                        mimetype: 'image/jpeg'
                    };
                }
                else if (msgType === 'videoMessage') {
                    messageContent = {
                        video: mediaBuffer,
                        caption: caption || "",
                        mimetype: 'video/mp4'
                    };
                }
                else if (msgType === 'audioMessage' || msgType === 'pttMessage') {
                    messageContent = {
                        audio: mediaBuffer,
                        mimetype: msgType === 'pttMessage' ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                        ptt: msgType === 'pttMessage'
                    };
                }
                else {
                    return reply("❌ Unsupported media type! Please reply to an image, video, or audio file.");
                }
            }
        } 
        // If only text
        else if (caption) {
            messageContent = {
                text: caption
            };
        }
        
        // Send as status with proper options
        await conn.sendMessage(statusJid, messageContent, { 
            backgroundColor: "#FF0000", // Background color for text status
            font: 0, // Font for text status (0 = system font)
            statusJidList: [myJid], // List of JIDs that will receive this status (your own JID)
            broadcast: true // Enable broadcast mode
        });
        
        // Success message
        await reply("✅ Status uploaded successfully!");
        
        // Success reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        
    } catch (error) {
        console.error("Status Upload Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
