// jawad tech
const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "surah",
    desc: "Play Quran surah audio by number (1-114)",
    category: "islamic",
    react: "📖",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("📖 Please provide a surah number!\n\nExample: .surah 1");

        // Validate surah number
        const surahNumber = parseInt(q);
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            return await reply("❌ Invalid surah number! Use 1-114");
        }

        // Stream directly from URL
        const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
        
        // Get stream directly from axios
        const response = await axios({
            method: 'GET',
            url: audioUrl,
            responseType: 'stream',
            timeout: 30000
        });

        // Send audio directly using the stream
        await conn.sendMessage(from, {
            audio: response.data, // This is the stream
            mimetype: "audio/mpeg",
            fileName: `Surah_${surahNumber}.mp3`
        }, { quoted: mek });

        // Success reaction
        await conn.sendMessage(from, { 
            react: { text: '✅', key: m.key } 
        });

    } catch (e) {
        console.error("Error in .surah command:", e);
        await reply("❌ Error occurred, please try again!");
        await conn.sendMessage(from, { 
            react: { text: '❌', key: m.key } 
        });
    }
});
