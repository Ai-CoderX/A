// Jawad TechX 
const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "play",
    desc: "Download YouTube audio with thumbnail (Multiple APIs)",
    category: "download",
    react: "🎶",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎧 Please provide a song name!\n\nExample: .play Faded Alan Walker");

        const { videos } = await yts(q);
        if (!videos || videos.length === 0) return await reply("❌ No results found!");

        const vid = videos[0];
        
        // Extract video ID and create proper watch URL for first API
        const videoId = vid.videoId;
        const watchUrl = `https://youtube.com/watch?v=${videoId}`;

        // 🎵 Send video thumbnail + info first (EXACTLY as specified)
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `- *AUDIO DOWNLOADER 🎧*\n╭━━❐━⪼\n┇๏ *Title* - ${vid.title}\n┇๏ *Duration* - ${vid.timestamp}\n┇๏ *Views* - ${vid.views.toLocaleString()}\n┇๏ *Author* - ${vid.author.name}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> *© Pᴏᴡᴇʀᴇᴅ Bʏ KHAN-MD ♡*`
        }, { quoted: mek });

        let audioUrl, title;
        let success = false;

        // API 1: Ootaizumi API (works with proper watch URL format)
        try {
            const api1 = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(watchUrl)}&format=mp3`;
            console.log("Trying API 1 with URL:", watchUrl);
            const res1 = await axios.get(api1);
            const json1 = res1.data;

            if (json1?.status && json1?.result?.download) {
                audioUrl = json1.result.download;
                title = json1.result.title || vid.title;
                success = true;
                console.log("✅ API 1 success with watch URL");
            }
        } catch (e1) {
            console.log("❌ API 1 failed:", e1.message);
        }

        // API 2: Danzy API (works with any YouTube URL)
        if (!success) {
            try {
                const api2 = `https://api.danzy.web.id/api/download/ytmp3?url=${encodeURIComponent(watchUrl)}`;
                console.log("Trying API 2 with URL:", watchUrl);
                const res2 = await axios.get(api2);
                const json2 = res2.data;

                if (json2?.status && json2?.data?.downloadUrl) {
                    audioUrl = json2.data.downloadUrl;
                    title = json2.data.title || vid.title;
                    success = true;
                    console.log("✅ API 2 success");
                }
            } catch (e2) {
                console.log("❌ API 2 failed:", e2.message);
            }
        }

        // API 3: FAA API (works with any YouTube URL)
        if (!success) {
            try {
                const api3 = `https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(watchUrl)}`;
                console.log("Trying API 3 with URL:", watchUrl);
                const res3 = await axios.get(api3);
                const json3 = res3.data;

                if (json3?.status && json3?.result?.mp3) {
                    audioUrl = json3.result.mp3;
                    title = json3.result.title || vid.title;
                    success = true;
                    console.log("✅ API 3 success");
                }
            } catch (e3) {
                console.log("❌ API 3 failed:", e3.message);
            }
        }

        if (!success || !audioUrl) {
            return await reply("❌ All download APIs failed! Try again later.");
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
