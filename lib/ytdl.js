// lib/ytdl.js
const yts = require('yt-search');

// Helper function to extract video ID
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
        /youtube\.com\/watch\?.*v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/shorts\/([^?]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Clean title for filename
function cleanTitle(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .substring(0, 100);
}

// Get video info using yt-search
async function getVideoInfo(videoId) {
    try {
        const search = await yts({ videoId });
        return search || null;
    } catch (error) {
        console.error("Error fetching video info:", error.message);
        return null;
    }
}

// 🎵 SaveTube Style (cdn403) - Returns direct download URL
async function dlaudio(url) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) return null;

        const search = await getVideoInfo(videoId);
        if (!search) return null;

        const cleanTitleText = cleanTitle(search.title);
        return `https://cdn403.savetube.vip/media/${videoId}/${cleanTitleText}-128-ytshorts.savetube.me.mp3`;
    } catch (error) {
        console.error("DLAudio Error:", error.message);
        return null;
    }
}

// 🎵 YTDL Zone Style - Returns direct download URL
async function dlsong(url) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) return null;

        const search = await getVideoInfo(videoId);
        if (!search) return null;

        const cleanTitleText = cleanTitle(search.title);
        return `https://ytdl.zone.id/download/${videoId}/${cleanTitleText}.mp3`;
    } catch (error) {
        console.error("DLSong Error:", error.message);
        return null;
    }
}

// 🎵 CDN400 Style - Returns direct download URL
async function dlmusic(url) {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) return null;

        const search = await getVideoInfo(videoId);
        if (!search) return null;

        const cleanTitleText = cleanTitle(search.title);
        return `https://cdn400.savetube.vip/media/${videoId}/${cleanTitleText}-128-ytshorts.savetube.me.mp3`;
    } catch (error) {
        console.error("DLMusic Error:", error.message);
        return null;
    }
}

module.exports = {
    dlaudio,
    dlsong,
    dlmusic,
    extractVideoId
};
