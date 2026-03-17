
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

        const surahNumber = parseInt(q);
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            return await reply("❌ Invalid surah number! Use 1-114");
        }

        // Direct stream - no saving, no checking
        const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNumber}.mp3`;
        
        // Get the stream
        const response = await axios({
            method: 'GET',
            url: audioUrl,
            responseType: 'stream'
        });

        // Send it directly
        await conn.sendMessage(from, {
            audio: response.data,
            mimetype: "audio/mpeg",
            fileName: `${surahNumber}.mp3`
        }, { quoted: mek });

    } catch (e) {
        console.error("Error:", e);
        await reply("❌ Failed to send");
    }
});
