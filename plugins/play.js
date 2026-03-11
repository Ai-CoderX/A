// jawad tech
const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "play2",
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

        // Check if it's a watch URL (contains /watch?v=)
        const isWatchUrl = vid.url.includes('/watch?v=');

        if (isWatchUrl) {
            console.log("🔍 Watch URL detected, trying APIs in sequence...");
            
            // Try API 1 first for watch URLs (your tested one)
            try {
                const api1 = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(vid.url)}&format=mp3`;
                const res1 = await axios.get(api1);
                const json1 = res1.data;

                if (json1?.status && json1?.result?.download) {
                    audioUrl = json1.result.download;
                    title = json1.result.title || vid.title;
                    success = true;
                    console.log("✅ API 1 success (watch URL)");
                } else {
                    throw new Error("API 1 failed");
                }
            } catch (e1) {
                console.log("❌ API 1 failed for watch URL:", e1.message);
                
                // Try API 2 (Danzy) if API 1 fails
                try {
                    const api2 = `https://api.danzy.web.id/api/download/ytmp3?url=${encodeURIComponent(vid.url)}`;
                    const res2 = await axios.get(api2);
                    const json2 = res2.data;

                    if (json2?.status && json2?.data?.downloadUrl) {
                        audioUrl = json2.data.downloadUrl;
                        title = json2.data.title || vid.title;
                        success = true;
                        console.log("✅ API 2 success (watch URL)");
                    } else {
                        throw new Error("API 2 failed");
                    }
                } catch (e2) {
                    console.log("❌ API 2 failed for watch URL:", e2.message);
                    
                    // Try API 3 (FAA) if API 2 fails
                    try {
                        const api3 = `https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(vid.url)}`;
                        const res3 = await axios.get(api3);
                        const json3 = res3.data;

                        if (json3?.status && json3?.result?.mp3) {
                            audioUrl = json3.result.mp3;
                            title = json3.result.title || vid.title;
                            success = true;
                            console.log("✅ API 3 success (watch URL)");
                        }
                    } catch (e3) {
                        console.log("❌ All APIs failed for watch URL");
                    }
                }
            }
        } else {
            console.log("🔍 Non-watch URL detected, trying API 1 only...");
            
            // For non-watch URLs, try only API 1
            try {
                const api1 = `https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(vid.url)}&format=mp3`;
                const res1 = await axios.get(api1);
                const json1 = res1.data;

                if (json1?.status && json1?.result?.download) {
                    audioUrl = json1.result.download;
                    title = json1.result.title || vid.title;
                    success = true;
                    console.log("✅ API 1 success (non-watch URL)");
                }
            } catch (e1) {
                console.log("❌ API 1 failed for non-watch URL:", e1.message);
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
