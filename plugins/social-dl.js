// plugins/download.js
const { cmd } = require("../command");
const config = require('../config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Platform URLs and their APIs
const platforms = {
    youtube: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-_]{11})/i,
        api: "https://jawad-tech.vercel.app/download/ytdl",
    },
    facebook: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(facebook\.com|fb\.watch)\/[^\s]+/i,
        api: "https://jawad-tech.vercel.app/downloader",
    },
    instagram: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(instagram\.com|instagr\.am)\/[^\s]+/i,
        api: "https://api-aswin-sparky.koyeb.app/api/downloader/igdl",
    },
    tiktok: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com|vt\.tiktok\.com)\/[^\s]+/i,
    },
    pinterest: {
        pattern: /(?:https?:\/\/)?(?:www\.)?(pinterest\.com|pin\.it)\/[^\s]+/i,
        api: "https://jawad-tech.vercel.app/download/pinterest",
    }
};

// Single download command for everything
cmd({
    pattern: "download",
    alias: ["down", "dl", "downurl"],
    desc: "Download from any URL (Social Media, Images, Videos, Audio, Documents)",
    category: "download",
    react: "⬇️",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return await reply("❌ Please provide a URL to download!\n\nExample:\n.download https://youtu.be/xxxx\n.download https://instagram.com/p/xxxx\n.download https://example.com/image.jpg\n.download https://example.com/song.mp3");
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Check if it's a social media URL
        let matchedPlatform = null;
        for (const [platform, data] of Object.entries(platforms)) {
            if (q.match(data.pattern)) {
                matchedPlatform = platform;
                break;
            }
        }

        // Handle based on URL type
        if (matchedPlatform) {
            await handleSocialDownload(conn, from, q, matchedPlatform, m);
        } else {
            await handleDirectDownload(conn, from, q, m);
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("Download error:", error);
        await reply("❌ Failed to download. Please check the URL and try again.");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// Handle social media downloads
async function handleSocialDownload(conn, from, url, platformType, message) {
    try {
        switch (platformType) {
            case "instagram":
                await downloadInstagram(conn, from, url, message);
                break;
            case "tiktok":
                await downloadTikTok(conn, from, url, message);
                break;
            case "youtube":
                await downloadYouTube(conn, from, url, message);
                break;
            case "facebook":
                await downloadFacebook(conn, from, url, message);
                break;
            case "pinterest":
                await downloadPinterest(conn, from, url, message);
                break;
            default:
                throw new Error("Unsupported platform");
        }
    } catch (error) {
        console.error(`Social download error for ${platformType}:`, error);
        throw error;
    }
}

// Instagram downloader
async function downloadInstagram(conn, from, url, message) {
    const apiUrl = `https://api-aswin-sparky.koyeb.app/api/downloader/igdl?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);

    if (!response.data?.status || !response.data.data?.length) {
        throw new Error("Failed to fetch Instagram media");
    }
    
    const mediaData = response.data.data;
    let sentCount = 0;

    for (const item of mediaData) {
        const mediaType = item.type === 'video' ? 'video' : 'image';
        
        await conn.sendMessage(from, {
            [mediaType]: { url: item.url },
            caption: sentCount === 0 ? `> *© ${config.BOT_NAME} Downloader*` : undefined
        }, { quoted: message });
        
        sentCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// TikTok downloader (multiple APIs)
async function downloadTikTok(conn, from, url, message) {
    let videoUrl;

    // Try First API
    try {
        const api1 = `https://jawad-tech.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
        const res1 = await axios.get(api1);
        if (res1.data?.status && res1.data?.result) {
            videoUrl = res1.data.result;
        } else {
            throw new Error("First API failed");
        }
    } catch (api1Error) {
        // Try Second API
        try {
            const api2 = `https://jawad-tech.vercel.app/download/ttdl?url=${encodeURIComponent(url)}`;
            const res2 = await axios.get(api2);
            if (res2.data?.status && res2.data?.result) {
                videoUrl = res2.data.result;
            } else {
                throw new Error("Second API failed");
            }
        } catch (api2Error) {
            // Try Third API
            const api3 = `https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(url)}`;
            const res3 = await axios.get(api3);
            if (!res3.data?.status || !res3.data?.result?.download) {
                throw new Error("All APIs failed");
            }
            videoUrl = res3.data.result.download;
        }
    }

    if (!videoUrl) throw new Error("No video URL found");

    await conn.sendMessage(from, {
        video: { url: videoUrl },
        mimetype: 'video/mp4',
        caption: `> *© ${config.BOT_NAME} Downloader*`
    }, { quoted: message });
}

// YouTube downloader
async function downloadYouTube(conn, from, url, message) {
    const apiUrl = `https://jawad-tech.vercel.app/download/ytdl?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);

    if (!response.data?.status || !response.data.result?.mp4) {
        throw new Error("Failed to fetch YouTube video");
    }
    
    await conn.sendMessage(from, {
        video: { url: response.data.result.mp4 },
        caption: `> *© ${config.BOT_NAME} Downloader*`
    }, { quoted: message });
}

// Facebook downloader
async function downloadFacebook(conn, from, url, message) {
    const apiUrl = `https://jawad-tech.vercel.app/downloader?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);

    if (!response.data?.status || !response.data.result?.length) {
        throw new Error("Failed to fetch Facebook video");
    }
    
    const video = response.data.result.find(v => v.quality === "HD") || 
                  response.data.result.find(v => v.quality === "SD");
                  
    if (!video?.url) throw new Error("No video URL found");
    
    await conn.sendMessage(from, {
        video: { url: video.url },
        caption: `> *© ${config.BOT_NAME} Downloader*`
    }, { quoted: message });
}

// Pinterest downloader
async function downloadPinterest(conn, from, url, message) {
    const apiUrl = `https://jawad-tech.vercel.app/download/pinterest?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);

    if (!response.data?.status || !response.data.result?.url) {
        throw new Error("Failed to fetch Pinterest media");
    }
    
    const isVideo = response.data.result.type === 'video';
    
    await conn.sendMessage(from, {
        [isVideo ? 'video' : 'image']: { url: response.data.result.url },
        caption: `> *© ${config.BOT_NAME} Downloader*`
    }, { quoted: message });
}

// Handle direct URL downloads (images, videos, audio, documents)
async function handleDirectDownload(conn, from, url, message) {
    try {
        // Get file info
        const headResponse = await axios.head(url, { timeout: 5000 }).catch(() => null);
        let contentType = headResponse?.headers['content-type'];
        const contentLength = headResponse?.headers['content-length'];
        const fileName = url.split('/').pop().split('?')[0] || 'download';

        // Check file size (limit to 100MB)
        if (contentLength && parseInt(contentLength) > 100 * 1024 * 1024) {
            throw new Error("File too large (max 100MB)");
        }

        // If content-type not available, try to detect from extension
        if (!contentType) {
            const ext = path.extname(fileName).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
                '.gif': 'image/gif', '.webp': 'image/webp', '.bmp': 'image/bmp',
                '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/x-msvideo',
                '.mkv': 'video/x-matroska', '.webm': 'video/webm',
                '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
                '.ogg': 'audio/ogg', '.aac': 'audio/aac',
                '.pdf': 'application/pdf', '.zip': 'application/zip', '.rar': 'application/x-rar-compressed'
            };
            contentType = mimeTypes[ext] || 'application/octet-stream';
        }

        // Handle based on content type
        if (contentType.startsWith('image/')) {
            // Direct image download
            await conn.sendMessage(from, {
                image: { url: url },
                caption: `> *© ${config.BOT_NAME} Downloader*`
            }, { quoted: message });
        }
        else if (contentType.startsWith('video/')) {
            // Direct video download
            await conn.sendMessage(from, {
                video: { url: url },
                caption: `> *© ${config.BOT_NAME} Downloader*`,
                mimetype: contentType
            }, { quoted: message });
        }
        else if (contentType.startsWith('audio/')) {
            // Direct audio download
            await conn.sendMessage(from, {
                audio: { url: url },
                mimetype: contentType,
                caption: `> *© ${config.BOT_NAME} Downloader*`
            }, { quoted: message });
        }
        else {
            // For documents and other files, download and send
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const buffer = Buffer.from(response.data);
            
            await conn.sendMessage(from, {
                document: buffer,
                fileName: fileName,
                mimetype: contentType,
                caption: `> *© ${config.BOT_NAME} Downloader*`
            }, { quoted: message });
        }

    } catch (error) {
        console.error("Direct download error:", error);
        
        // Final fallback: try to download as document
        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const buffer = Buffer.from(response.data);
            const fileName = url.split('/').pop().split('?')[0] || 'download';
            const contentType = response.headers['content-type'] || 'application/octet-stream';

            await conn.sendMessage(from, {
                document: buffer,
                fileName: fileName,
                mimetype: contentType,
                caption: `> *© ${config.BOT_NAME} Downloader*`
            }, { quoted: message });
        } catch (fallbackError) {
            throw new Error("Failed to download file");
        }
    }
}
