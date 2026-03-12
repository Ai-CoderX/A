const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');
const config = require('../config');

// Helper for small caps font
const toSmallCaps = (text) => {
    const map = {
        'a': 'ᴀ','b': 'ʙ','c': 'ᴄ','d': 'ᴅ','e': 'ᴇ','f': 'ғ','g': 'ɢ','h': 'ʜ','i': 'ɪ','j': 'ᴊ',
        'k': 'ᴋ','l': 'ʟ','m': 'ᴍ','n': 'ɴ','o': 'ᴏ','p': 'ᴘ','q': 'ǫ','r': 'ʀ','s': 's','t': 'ᴛ',
        'u': 'ᴜ','v': 'ᴠ','w': 'ᴡ','x': 'x','y': 'ʏ','z': 'ᴢ'
    };
    return text.split('').map(c => map[c.toLowerCase()] || c).join('');
};

cmd({
    pattern: "song",
    alias: ["yt", "music", "ytdl"],
    desc: "Download YouTube song or video",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("🎶 Please provide a YouTube video name or link.\n\nExample:\n`.song Alone - Alan Walker`");

        // 🔍 Search YouTube
        let video = null;
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            const videoId = q.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            const results = await yts({ videoId: videoId ? videoId[1] : q });
            video = results;
        } else {
            const search = await yts(q);
            if (!search.videos || !search.videos.length) return await reply("❌ No results found.");
            video = search.videos[0];
        }

        // 🖼 Menu Caption
        const caption = `*╭┈───〔 ${toSmallCaps('YT Downloader')} 〕┈───⊷*
*├▢ 🎬 Title:* ${video.title}
*├▢ 📺 Channel:* ${video.author.name}
*├▢ ⏰ Duration:* ${video.timestamp}
*╰───────────────────⊷*
*╭───⬡ ${toSmallCaps('Select Format')} ⬡───*
*┋ ⬡ 1* 🎧 ${toSmallCaps('Audio (MP3)')}
*┋ ⬡ 2* 📹 ${toSmallCaps('Video (MP4)')}
*╰───────────────────⊷*

> ${toSmallCaps('*Please Reply With 1 or 2')}*`;

        const sent = await conn.sendMessage(from, {
            image: { url: video.thumbnail },
            caption
        }, { quoted: mek });

        const msgId = sent.key.id;

        // 🕒 Wait for user reply
        conn.ev.on("messages.upsert", async (msgData) => {
            const received = msgData.messages[0];
            if (!received.message) return;

            const text = received.message.conversation || received.message.extendedTextMessage?.text;
            const sender = received.key.remoteJid;
            const replyToBot = received.message.extendedTextMessage?.contextInfo?.stanzaId === msgId;

            if (replyToBot) {
                await conn.sendMessage(sender, { react: { text: '⬇️', key: received.key } });

                if (text === "1" || text === "2") {
                    const type = text === "1" ? "mp3" : "mp4";

                    if (type === "mp3") {
                        // 🎵 AUDIO DOWNLOAD - TRY ALL 6 APIs
                        let audioUrl, title;
                        let success = false;
                        let lastError = null;

                        // API 1: Your Custom API - dlaudio (cdn403)
                        if (!success) {
                            try {
                                const api1 = `https://jawad-tech.vercel.app/dlaudio?url=${encodeURIComponent(video.url)}`;
                                const res1 = await axios.get(api1);
                                const json1 = res1.data;

                                if (json1?.status && json1?.download) {
                                    audioUrl = json1.download;
                                    title = json1.title || video.title;
                                    
                                    try {
                                        await conn.sendMessage(sender, {
                                            audio: { url: audioUrl },
                                            mimetype: "audio/mpeg",
                                            fileName: `${title}.mp3`,
                                            ptt: false
                                        }, { quoted: received });
                                        
                                        success = true;
                                        console.log("✅ API 1 (dlaudio) success");
                                    } catch (audioError) {
                                        console.log("❌ Failed to send from API 1:", audioError.message);
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
                                const api2 = `https://jawad-tech.vercel.app/dlsong?url=${encodeURIComponent(video.url)}`;
                                const res2 = await axios.get(api2);
                                const json2 = res2.data;

                                if (json2?.status && json2?.download) {
                                    audioUrl = json2.download;
                                    title = json2.title || video.title;
                                    
                                    try {
                                        await conn.sendMessage(sender, {
                                            audio: { url: audioUrl },
                                            mimetype: "audio/mpeg",
                                            fileName: `${title}.mp3`,
                                            ptt: false
                                        }, { quoted: received });
                                        
                                        success = true;
                                        console.log("✅ API 2 (dlsong) success");
                                    } catch (audioError) {
                                        console.log("❌ Failed to send from API 2:", audioError.message);
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
                                const api3 = `https://jawad-tech.vercel.app/dlmusic?url=${encodeURIComponent(video.url)}`;
                                const res3 = await axios.get(api3);
                                const json3 = res3.data;

                                if (json3?.status && json3?.download) {
                                    audioUrl = json3.download;
                                    title = json3.title || video.title;
                                    
                                    try {
                                        await conn.sendMessage(sender, {
                                            audio: { url: audioUrl },
                                            mimetype: "audio/mpeg",
                                            fileName: `${title}.mp3`,
                                            ptt: false
                                        }, { quoted: received });
                                        
                                        success = true;
                                        console.log("✅ API 3 (dlmusic) success");
                                    } catch (audioError) {
                                        console.log("❌ Failed to send from API 3:", audioError.message);
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
                                const api4 = `https://api.nexray.web.id/downloader/v1/ytmp3?url=${encodeURIComponent(video.url)}`;
                                const res4 = await axios.get(api4);
                                const json4 = res4.data;

                                if (json4?.status && json4?.result?.url) {
                                    audioUrl = json4.result.url;
                                    title = json4.result.title || video.title;
                                    
                                    try {
                                        await conn.sendMessage(sender, {
                                            audio: { url: audioUrl },
                                            mimetype: "audio/mpeg",
                                            fileName: `${title}.mp3`,
                                            ptt: false
                                        }, { quoted: received });
                                        
                                        success = true;
                                        console.log("✅ API 4 (NexRay v1) success");
                                    } catch (audioError) {
                                        console.log("❌ Failed to send from API 4:", audioError.message);
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
                                const api5 = `https://api.nexray.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
                                const res5 = await axios.get(api5);
                                const json5 = res5.data;

                                if (json5?.status && json5?.result?.url) {
                                    audioUrl = json5.result.url;
                                    title = json5.result.title || video.title;
                                    
                                    try {
                                        await conn.sendMessage(sender, {
                                            audio: { url: audioUrl },
                                            mimetype: "audio/mpeg",
                                            fileName: `${title}.mp3`,
                                            ptt: false
                                        }, { quoted: received });
                                        
                                        success = true;
                                        console.log("✅ API 5 (NexRay regular) success");
                                    } catch (audioError) {
                                        console.log("❌ Failed to send from API 5:", audioError.message);
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
                                const api6 = `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`;
                                const res6 = await axios.get(api6);
                                const json6 = res6.data;

                                if (json6?.status && json6?.result?.dlink) {
                                    audioUrl = json6.result.dlink;
                                    title = json6.result.youtube?.title || video.title;
                                    
                                    try {
                                        await conn.sendMessage(sender, {
                                            audio: { url: audioUrl },
                                            mimetype: "audio/mpeg",
                                            fileName: `${title}.mp3`,
                                            ptt: false
                                        }, { quoted: received });
                                        
                                        success = true;
                                        console.log("✅ API 6 (Deline) success");
                                    } catch (audioError) {
                                        console.log("❌ Failed to send from API 6:", audioError.message);
                                    }
                                }
                            } catch (e6) {
                                console.log("❌ API 6 failed:", e6.message);
                                lastError = e6;
                            }
                        }

                        if (!success) {
                            return await conn.sendMessage(sender, { 
                                text: "❌ All 6 audio sources failed! Try again later.\n" + (lastError ? `Last error: ${lastError.message}` : "") 
                            }, { quoted: received });
                        }

                    } else {
                        // 📹 VIDEO DOWNLOAD - Keep your original video API
                        const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(video.url)}`;
                        const { data } = await axios.get(apiUrl);

                        if (!data?.status || !data?.result || !data.result.mp4) {
                            return await conn.sendMessage(sender, { text: "❌ Video download failed, please try again later." }, { quoted: received });
                        }

                        await conn.sendMessage(sender, {
                            video: { url: data.result.mp4 },
                            caption: `🎬 *${video.title}*\n\n> *Powered by JawadTechX*`
                        }, { quoted: received });
                    }

                    await conn.sendMessage(sender, { react: { text: '✅', key: received.key } });
                } else {
                    await conn.sendMessage(sender, {
                        text: `❌ *Invalid selection!*\nPlease reply with:\n1️⃣ for Audio (MP3)\n2️⃣ for Video (MP4)`
                    }, { quoted: received });
                }
            }
        });

    } catch (e) {
        console.error(e);
        await reply(`❌ Error: ${e.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
