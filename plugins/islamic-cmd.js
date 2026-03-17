// jawad tech
const { cmd } = require('../command');
const axios = require('axios');
const { Readable } = require('stream');

cmd({
    pattern: "surah",
    desc: "Play Quran surah audio by number (1-114)",
    category: "islamic",
    react: "📖",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("📖 Please provide a surah number!\n\nExample: .surah 1");

        const surahNumber = parseInt(q);
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            return await reply("❌ Invalid surah number! Use 1-114");
        }

        const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
        
        // Get the stream
        const response = await axios({
            method: 'GET',
            url: audioUrl,
            responseType: 'stream'
        });

        // Add metadata to the stream (this fixes the toString error)
        const stream = response.data;
        stream._readableState = stream._readableState || {};
        stream.url = audioUrl; // Add URL for reference
        
        // Send with proper options
        await conn.sendMessage(from, {
            audio: stream,
            mimetype: "audio/mpeg",
            ptt: true, // This makes it a voice note!
            fileName: `${surahNumber}.mp3`
        }, { 
            quoted: mek,
            // Add these options to help Baileys
            media: stream
        });

    } catch (e) {
        console.error("Error:", e);
        await reply("❌ Failed to send");
    }
});
