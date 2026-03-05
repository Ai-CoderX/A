const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ouch",
    alias: ["awch", "ahh", "goiz", "sparrow"],
    desc: "Funny Pakistani meme sound - Ouch awch goiz",
    category: "fun",
    react: "😂",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        const audioUrl = "https://files.catbox.moe/ije8ef.mp3";
        
        await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4',
            ptt: false,
            fileName: "ouch.mp3"
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});
                               
