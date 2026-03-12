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
        if (!q) return await reply("🎧 Please provide a song name!\n\nExample: .play Moye Moye");

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
        let lastError = null;

        // Try API 1 first (dlaudio - cdn403)
        try {
            const api1 = `https://jawad-tech.vercel.app/dlaudio?url=${encodeURIComponent(vid.url)}`;
            const res1 = await axios.get(api1);
            const json1 = res1.data;

            if (json1?.status && json1?.download) {
                audioUrl = json1.download;
                title = json1.title || vid.title;
                
                // Try to send audio
                try {
                    await conn.sendMessage(from, {
                        audio: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${title}.mp3`
                    }, { quoted: mek });
                    
                    success = true;
                    console.log("✅ API 1 success - audio sent");
                } catch (audioError) {
                    console.log("❌ Failed to send audio from API 1:", audioError.message);
                    throw new Error("Audio send failed");
                }
            } else {
                throw new Error("Invalid response from API 1");
            }
        } catch (e1) {
            console.log("❌ API 1 failed:", e1.message);
            lastError = e1;
            
            // Try API 2 as fallback (dlsong - ytdl.zone.id)
            if (!success) {
                try {
                    const api2 = `https://jawad-tech.vercel.app/dlsong?url=${encodeURIComponent(vid.url)}`;
                    const res2 = await axios.get(api2);
                    const json2 = res2.data;

                    if (json2?.status && json2?.download) {
                        audioUrl = json2.download;
                        title = json2.title || vid.title;
                        
                        // Try to send audio
                        try {
                            await conn.sendMessage(from, {
                                audio: { url: audioUrl },
                                mimetype: "audio/mpeg",
                                fileName: `${title}.mp3`
                            }, { quoted: mek });
                            
                            success = true;
                            console.log("✅ API 2 success - audio sent");
                        } catch (audioError) {
                            console.log("❌ Failed to send audio from API 2:", audioError.message);
                            throw new Error("Audio send failed");
                        }
                    } else {
                        throw new Error("Invalid response from API 2");
                    }
                } catch (e2) {
                    console.log("❌ API 2 failed:", e2.message);
                    lastError = e2;
                    
                    // Try API 3 as final fallback (dlmusic - cdn400)
                    if (!success) {
                        try {
                            const api3 = `https://jawad-tech.vercel.app/dlmusic?url=${encodeURIComponent(vid.url)}`;
                            const res3 = await axios.get(api3);
                            const json3 = res3.data;

                            if (json3?.status && json3?.download) {
                                audioUrl = json3.download;
                                title = json3.title || vid.title;
                                
                                // Try to send audio
                                try {
                                    await conn.sendMessage(from, {
                                        audio: { url: audioUrl },
                                        mimetype: "audio/mpeg",
                                        fileName: `${title}.mp3`
                                    }, { quoted: mek });
                                    
                                    success = true;
                                    console.log("✅ API 3 success - audio sent");
                                } catch (audioError) {
                                    console.log("❌ Failed to send audio from API 3:", audioError.message);
                                    throw new Error("Audio send failed");
                                }
                            } else {
                                throw new Error("Invalid response from API 3");
                            }
                        } catch (e3) {
                            console.log("❌ API 3 failed:", e3.message);
                            lastError = e3;
                        }
                    }
                }
            }
        }

        if (!success) {
            return await reply("❌ All download sources failed! Try again later.\n" + (lastError ? `Error: ${lastError.message}` : ""));
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .play command:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
