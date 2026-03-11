// jawad tech
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

        // 🎵 Send video thumbnail + info first (EXACTLY as specified - NO CHANGES)
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `- *AUDIO DOWNLOADER 🎧*\n╭━━❐━⪼\n┇๏ *Title* - ${vid.title}\n┇๏ *Duration* - ${vid.timestamp}\n┇๏ *Views* - ${vid.views.toLocaleString()}\n┇๏ *Author* - ${vid.author.name}\n┇๏ *Status* - Downloading...\n╰━━❑━⪼\n> *© Pᴏᴡᴇʀᴇᴅ Bʏ KHAN-MD ♡*`
        }, { quoted: mek });

        let audioUrl, title;
        let success = false;

        // API 1: Ootaizumi API (your first one)
        try {
            const api1 = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(vid.url)}&format=mp3`;
            const res1 = await axios.get(api1);
            const json1 = res1.data;

            if (json1?.status && json1?.result?.download) {
                const potentialUrl = json1.result.download;
                
                // Check if URL contains cdn401 (inaccessible) - ONLY skip cdn401, keep cdn403
                if (potentialUrl.includes('cdn401.savetube.vip')) {
                    console.log("⚠️ API 1 returned cdn401 (inaccessible), skipping to next API...");
                    throw new Error("Inaccessible CDN URL (401)");
                } else {
                    // Accept cdn403 and any other working URLs
                    audioUrl = potentialUrl;
                    title = json1.result.title || vid.title;
                    success = true;
                    console.log("✅ API 1 success with valid URL");
                }
            } else {
                throw new Error("Invalid response from API 1");
            }
        } catch (e1) {
            console.log("❌ API 1 failed:", e1.message);
        }

        // API 2: Danzy API (if API 1 fails)
        if (!success) {
            try {
                const api2 = `https://api.danzy.web.id/api/download/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res2 = await axios.get(api2, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                const json2 = res2.data;

                if (json2?.status && json2?.data?.downloadUrl) {
                    audioUrl = json2.data.downloadUrl;
                    title = json2.data.title || vid.title;
                    success = true;
                    console.log("✅ API 2 success");
                } else {
                    throw new Error("Invalid response from API 2");
                }
            } catch (e2) {
                console.log("❌ API 2 failed:", e2.message);
            }
        }

        // API 3: FAA API (if API 2 fails)
        if (!success) {
            try {
                const api3 = `https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res3 = await axios.get(api3, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                const json3 = res3.data;

                if (json3?.status && json3?.result?.mp3) {
                    audioUrl = json3.result.mp3;
                    title = json3.result.title || vid.title;
                    success = true;
                    console.log("✅ API 3 success");
                } else {
                    throw new Error("Invalid response from API 3");
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
