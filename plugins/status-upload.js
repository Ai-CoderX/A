// Jawad

const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

cmd({
    pattern: "status",
    alias: ["uploadstatus", "mystatus", "setstatus", "upstatus", "mystory"],
    desc: "Upload status with media or text (like manual upload)",
    category: "owner",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, isCreator, isGroup }) => {
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
                `• .mystatus Hello everyone\n` +
                `• Reply to an image with: .mystatus\n` +
                `• Reply to a video with: .mystatus`
            );
        }
        
        // Send loading reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        let statusContent = [];
        
        // If there's quoted media
        if (quotedMsg) {
            try {
                // Get message type
                const msgType = Object.keys(quotedMsg.message || {})[0];
                
                // Download media
                const stream = await downloadContentFromMessage(
                    quotedMsg.message[msgType],
                    msgType.replace('Message', '')
                );
                
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                if (!buffer || buffer.length === 0) {
                    throw new Error("Failed to download media");
                }
                
                // Prepare status based on media type
                if (msgType === 'imageMessage') {
                    statusContent.push({
                        type: 'image',
                        media: buffer,
                        caption: caption || "",
                        mimetype: quotedMsg.message[msgType].mimetype || 'image/jpeg'
                    });
                } 
                else if (msgType === 'videoMessage') {
                    statusContent.push({
                        type: 'video',
                        media: buffer,
                        caption: caption || "",
                        mimetype: quotedMsg.message[msgType].mimetype || 'video/mp4'
                    });
                } 
                else if (msgType === 'audioMessage' || msgType === 'pttMessage') {
                    statusContent.push({
                        type: 'audio',
                        media: buffer,
                        mimetype: msgType === 'pttMessage' ? 'audio/ogg; codecs=opus' : 'audio/mp4',
                        ptt: msgType === 'pttMessage'
                    });
                }
                else if (msgType === 'documentMessage') {
                    // Convert document to status (shows as document)
                    statusContent.push({
                        type: 'document',
                        media: buffer,
                        mimetype: quotedMsg.message[msgType].mimetype,
                        fileName: quotedMsg.message[msgType].fileName || 'document',
                        caption: caption || ""
                    });
                }
                else {
                    return reply("❌ Unsupported media type! Please reply to an image, video, audio, or document.");
                }
                
            } catch (downloadError) {
                console.error("Download error:", downloadError);
                return reply(`❌ Failed to download media: ${downloadError.message}`);
            }
        } 
        // If only text
        else if (caption) {
            statusContent.push({
                type: 'text',
                text: caption
            });
        }
        
        // Upload as status
        try {
            // Send status update
            await conn.sendMessage(
                'status@broadcast', 
                statusContent
            );
            
            // Success message
            await reply("✅ Status uploaded successfully!");
            
            // Success reaction
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
            
        } catch (statusError) {
            console.error("Status upload error:", statusError);
            reply(`❌ Failed to upload status: ${statusError.message}`);
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        }
        
    } catch (error) {
        console.error("My Status Error:", error);
        reply(`❌ Error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
