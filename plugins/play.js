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
        let lastError = null;

        // API 1: Your Custom API - dlaudio (cdn403)
        if (!success) {
            try {
                const api1 = `https://jawad-tech.vercel.app/dlaudio?url=${encodeURIComponent(vid.url)}`;
                const res1 = await axios.get(api1);
                const json1 = res1.data;

                if (json1?.status && json1?.download) {
                    audioUrl = json1.download;
                    title = json1.title || vid.title;
                    
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        
                        success = true;
                        console.log("✅ API 1 (dlaudio) success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 1:", audioError.message);
                        throw new Error("Audio send failed");
                    }
                }
            } catch (e1) {
                console.log("❌ API 1 failed:", e1.message);
                lastError = e1;
            }
        }

        // API 2: Your Custom API - dlsong (ytdl.zone.id)
        if (!success) {
            try {
                const api2 = `https://jawad-tech.vercel.app/dlsong?url=${encodeURIComponent(vid.url)}`;
                const res2 = await axios.get(api2);
                const json2 = res2.data;

                if (json2?.status && json2?.download) {
                    audioUrl = json2.download;
                    title = json2.title || vid.title;
                    
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        
                        success = true;
                        console.log("✅ API 2 (dlsong) success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 2:", audioError.message);
                        throw new Error("Audio send failed");
                    }
                }
            } catch (e2) {
                console.log("❌ API 2 failed:", e2.message);
                lastError = e2;
            }
        }

        // API 3: Your Custom API - dlmusic (cdn400)
        if (!success) {
            try {
                const api3 = `https://jawad-tech.vercel.app/dlmusic?url=${encodeURIComponent(vid.url)}`;
                const res3 = await axios.get(api3);
                const json3 = res3.data;

                if (json3?.status && json3?.download) {
                    audioUrl = json3.download;
                    title = json3.title || vid.title;
                    
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        
                        success = true;
                        console.log("✅ API 3 (dlmusic) success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 3:", audioError.message);
                        throw new Error("Audio send failed");
                    }
                }
            } catch (e3) {
                console.log("❌ API 3 failed:", e3.message);
                lastError = e3;
            }
        }

        // API 4: NexRay API (v1/ytmp3)
        if (!success) {
            try {
                const api4 = `https://api.nexray.web.id/downloader/v1/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res4 = await axios.get(api4);
                const json4 = res4.data;

                if (json4?.status && json4?.result?.url) {
                    audioUrl = json4.result.url;
                    title = json4.result.title || vid.title;
                    
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        
                        success = true;
                        console.log("✅ API 4 (NexRay v1) success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 4:", audioError.message);
                        throw new Error("Audio send failed");
                    }
                }
            } catch (e4) {
                console.log("❌ API 4 failed:", e4.message);
                lastError = e4;
            }
        }

        // API 5: NexRay API (regular ytmp3)
        if (!success) {
            try {
                const api5 = `https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res5 = await axios.get(api5);
                const json5 = res5.data;

                if (json5?.status && json5?.result?.url) {
                    audioUrl = json5.result.url;
                    title = json5.result.title || vid.title;
                    
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        
                        success = true;
                        console.log("✅ API 5 (NexRay regular) success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 5:", audioError.message);
                        throw new Error("Audio send failed");
                    }
                }
            } catch (e5) {
                console.log("❌ API 5 failed:", e5.message);
                lastError = e5;
            }
        }

        // API 6: Deline API
        if (!success) {
            try {
                const api6 = `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(vid.url)}`;
                const res6 = await axios.get(api6);
                const json6 = res6.data;

                if (json6?.status && json6?.result?.dlink) {
                    audioUrl = json6.result.dlink;
                    title = json6.result.youtube?.title || vid.title;
                    
                    try {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });
                        
                        success = true;
                        console.log("✅ API 6 (Deline) success");
                    } catch (audioError) {
                        console.log("❌ Failed to send from API 6:", audioError.message);
                        throw new Error("Audio send failed");
                    }
                }
            } catch (e6) {
                console.log("❌ API 6 failed:", e6.message);
                lastError = e6;
            }
        }

        if (!success) {
            return await reply("❌ All 6 download sources failed! Try again later.\n" + (lastError ? `Last error: ${lastError.message}` : ""));
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .play command:", e);
        await reply("❌ Error occurred, please try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
