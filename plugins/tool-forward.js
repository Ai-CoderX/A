// KHAN MD 

const { cmd } = require("../command");
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');

cmd({
  pattern: "forward",
  alias: ["frd", "fwd"],
  desc: "Forward messages to groups using WhatsApp native method",
  category: "owner",
  filename: __filename
}, async (client, message, match, { isCreator, reply, from }) => {
  try {
    // Owner check - use reply function from context
    if (!isCreator) return await reply("*📛 Owner Only Command*");
    
    // Quoted message check
    if (!message.quoted) return await reply("*🍁 Please reply to a message to forward*");

    // Handle match input
    let jidInput = "";
    if (typeof match === "string") {
      jidInput = match.trim();
    } else if (Array.isArray(match)) {
      jidInput = match.join(" ").trim();
    } else if (match && typeof match === "object") {
      jidInput = match.text || "";
    }
    
    if (!jidInput) {
      return await reply(
        "*🍁 Usage:* `.forward jid1,jid2,...`\n" +
        "*Example:* `.forward 120363411055156472@g.us`\n" +
        "*Example (multiple):* `.forward 120363411055156472@g.us,1234567890@s.whatsapp.net`\n" +
        "Reply to a message first!"
      );
    }

    // Process JIDs - SUPPORT GROUP, PERSONAL, AND NEWSLETTER JIDs
    const rawJids = jidInput.split(',').map(jid => jid.trim()).filter(jid => jid);
    const validJids = rawJids
      .map(jid => {
        // Check if it's a complete JID with suffix
        if (jid.includes('@')) {
          // Already a proper JID
          if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net') || jid.endsWith('@newsletter')) {
            // Extract numbers from JID if needed
            const numbers = jid.match(/\d+/g);
            if (!numbers || numbers.length === 0) return null;
            
            if (jid.endsWith('@g.us')) {
              return `${numbers.join('')}@g.us`;
            } else if (jid.endsWith('@s.whatsapp.net')) {
              return `${numbers.join('')}@s.whatsapp.net`;
            } else if (jid.endsWith('@newsletter')) {
              return `${numbers.join('')}@newsletter`;
            }
          }
          return null;
        } 
        // If just numbers, assume it's a group JID
        else if (/^\d+$/.test(jid)) {
          return `${jid}@g.us`;
        }
        return null;
      })
      .filter(jid => jid !== null)
      .slice(0, 50); // Max 50 like other bot

    if (validJids.length === 0) {
      return await reply(
        "❌ No valid JIDs found\n" +
        "Provide JIDs like:\n" +
        "• `120363411055156472@g.us` (group)\n" +
        "• `1234567890@s.whatsapp.net` (personal)\n" +
        "• `120363409607339372@newsletter` (newsletter)\n" +
        "• `120363411055156472@g.us,1234567890@s.whatsapp.net,120363409607339372@newsletter` (multiple)\n" +
        "• `120363411055156472` (numbers only = group)\n" +
        "Separate multiple with commas"
      );
    }

    // Remove duplicates
    const uniqueJids = [...new Set(validJids)];
    
    // Start processing
    await reply(`🔄 Forwarding to ${uniqueJids.length} chats...`);

    let successCount = 0;
    const failedJids = [];

    // Get the quoted message
    const quotedMsg = message.quoted;
    
    // Create message structure if needed
    let messageContent = quotedMsg.message;
    if (!messageContent) {
      // Create message structure from quoted
      const mtype = quotedMsg.mtype;
      if (mtype && quotedMsg.msg) {
        messageContent = {};
        if (mtype === 'conversation') {
          messageContent.conversation = quotedMsg.text;
        } else {
          const typeKey = mtype.replace('Message', '').toLowerCase();
          messageContent[typeKey + 'Message'] = quotedMsg.msg;
        }
      }
    }

    if (!messageContent) {
      return await reply("❌ Could not extract message content from quoted message");
    }

    // Forward to each chat
    for (const [index, jid] of uniqueJids.entries()) {
      try {
        // Create the message to forward
        const forwardData = generateWAMessageFromContent(
          jid,
          messageContent,
          { userJid: client.user.id }
        );

        // Send using relayMessage for native forwarding
        await client.relayMessage(jid, forwardData.message, {
          messageId: forwardData.key.id
        });

        successCount++;
        
        // Progress update every 5 chats
        if ((index + 1) % 5 === 0 && uniqueJids.length > 5) {
          await reply(`📤 Sent to ${index + 1}/${uniqueJids.length} chats...`);
        }
        
        // Small delay
        if (index < uniqueJids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`Forward error to ${jid}:`, error.message);
        failedJids.push({
          jid: jid.includes('@g.us') ? jid.replace('@g.us', '') : 
               jid.includes('@s.whatsapp.net') ? jid.replace('@s.whatsapp.net', '') :
               jid.replace('@newsletter', ''),
          error: error.message.substring(0, 30)
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final report
    let report = `✅ *Forward Complete*\n\n` +
                 `📤 Success: ${successCount}/${uniqueJids.length}\n`;
    
    if (quotedMsg.mtype) {
      const contentType = quotedMsg.mtype.replace('Message', '');
      report += `📦 Content Type: ${contentType}\n`;
    }
    
    // Count types
    const groupCount = uniqueJids.filter(jid => jid.endsWith('@g.us')).length;
    const personalCount = uniqueJids.filter(jid => jid.endsWith('@s.whatsapp.net')).length;
    const newsletterCount = uniqueJids.filter(jid => jid.endsWith('@newsletter')).length;
    report += `👥 Groups: ${groupCount}\n`;
    report += `👤 Personal: ${personalCount}\n`;
    report += `📰 Newsletters: ${newsletterCount}\n`;
    
    if (failedJids.length > 0) {
      report += `\n❌ Failed (${failedJids.length}):\n`;
      failedJids.slice(0, 3).forEach(f => {
        report += `• ${f.jid}: ${f.error}\n`;
      });
      if (failedJids.length > 3) report += `... +${failedJids.length - 3} more`;
    }
    
    if (rawJids.length > uniqueJids.length) {
      report += `\n⚠️ Removed ${rawJids.length - uniqueJids.length} duplicate JIDs`;
    }
    
    if (rawJids.length > 50) {
      report += `\n⚠️ Limited to first 50 of ${rawJids.length} JIDs`;
    }

    await reply(report);

  } catch (error) {
    console.error("Forward Error:", error);
    await reply(
      `💢 Error: ${error.message.substring(0, 100)}\n\n` +
      `Try:\n1. Make sure bot is admin in target groups\n` +
      `2. Use recent messages (not too old)\n` +
      `3. Check JID format`
    );
  }
});
