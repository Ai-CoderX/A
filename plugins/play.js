// Jawad Tech
const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "play",
    desc: "Download YouTube audio with thumbnail",
    category: "download",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎧 Please provide a song name!\n\nExample: .play Faded Alan Walker");

        const { videos } = await yts(q);
        if (!videos || videos.length === 0) return await reply("❌ No results found!");

        const vid = videos[0];

        // 🎵 Send video thumbnail + info first
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `- *AUDIO DOWNLOADER 🎧*\n╭━━❐━⪼\n┇๏ *Title* - ${vid.title}\n┇๏ *Duration* - ${vid.timestamp}\n┇๏ *Views* - ${vid.views.toLocaleString()}\n┇๏ *Author* - ${vid.author.name}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> *© Pᴏᴡᴇʀᴇᴅ Bʏ KHAN-MD ♡*`
        }, { quoted: mek });

        let audioUrl, title;
        let success = false;

        // Try SaveTube API first (dlaudio)
        try {
            const api1 = `https://jawad-tech.vercel.app/dlaudio?url=${encodeURIComponent(vid.url)}`;
            const res1 = await axios.get(api1);
            const json1 = res1.data;

            if (json1?.status && json1?.download) {
                audioUrl = json1.download;
                title = json1.title || vid.title;
                success = true;
                console.log("✅ SaveTube API success");
            } else {
                throw new Error("Invalid response from SaveTube API");
            }
        } catch (e1) {
            console.log("❌ SaveTube API failed:", e1.message);
            
            // Try YTDL Zone API as fallback (dlsong)
            if (!success) {
                try {
                    const api2 = `https://jawad-tech.vercel.app/dlsong?url=${encodeURIComponent(vid.url)}`;
                    const res2 = await axios.get(api2);
                    const json2 = res2.data;

                    if (json2?.status && json2?.download) {
                        audioUrl = json2.download;
                        title = json2.title || vid.title;
                        success = true;
                        console.log("✅ YTDL Zone API success");
                    } else {
                        throw new Error("Invalid response from YTDL Zone API");
                    }
                } catch (e2) {
                    console.log("❌ YTDL Zone API failed:", e2.message);
                }
            }
        }

        if (!success || !audioUrl) {
            return await reply("❌ Download failed! Try again later.");
        }

        // 🎧 Send final audio file
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .play command:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
