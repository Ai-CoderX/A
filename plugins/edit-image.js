const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// API parts split
const api = {
    https: "https://",
    domain1: "img",
    domain2: "editor",
    tld: ".co",
    path: "/api"
};

const BASE = api.https + api.domain1 + api.domain2 + api.tld + api.path;
const REFERER = api.https + api.domain1 + api.domain2 + api.tld + "/generator";
const ORIGIN = api.https + api.domain1 + api.domain2 + api.tld;

cmd({
    pattern: "editimg",
    alias: ["edit", "imageedit"],
    desc: "Edit an image using AI prompt.",
    category: "ai",
    react: "🚀",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    
    let client = null;
    
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!/image/.test(mime)) return reply("📸 Please reply to an image with a prompt.");
        if (!text) return reply("❓ Please provide a prompt.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // ===== CREATE ONE CLIENT WITH FRESH COOKIES =====
        client = axios.create({
            headers: {
                "accept": "*/*",
                "accept-language": "id-ID",
                "content-type": "application/json",
                "origin": ORIGIN,
                "referer": REFERER,
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
            }
        });
        
        // First visit to get cookies (this sets the cookies in client)
        await client.get(REFERER);
        
        // ===== USE SAME CLIENT FOR EVERYTHING =====
        
        // 1. Get upload URL
        const uploadRes = await client.post(`${BASE}/get-upload-url`, {
            fileName: "image.jpg",
            contentType: "image/jpeg",
            fileSize: (await q.download()).length
        });

        if (!uploadRes.data.uploadUrl || !uploadRes.data.publicUrl) {
            throw new Error("Upload failed");
        }

        // 2. Upload image (using same client's cookies but different axios for PUT)
        const mediaBuffer = await q.download();
        await axios.put(uploadRes.data.uploadUrl, mediaBuffer, {
            headers: { "content-type": "image/jpeg" }
        });

        // 3. Generate image (using SAME client)
        const generateRes = await client.post(`${BASE}/generate-image`, {
            prompt: text,
            styleId: "realistic",
            mode: "image",
            imageUrl: uploadRes.data.publicUrl,
            imageUrls: [uploadRes.data.publicUrl],
            numImages: 1,
            outputFormat: "png",
            model: "nano-banana"
        });

        if (!generateRes.data.taskId) throw new Error("Task creation failed");
        
        // 4. Wait for result (using SAME client)
        let resultUrl = null;
        let waiting = true;
        
        while (waiting) {
            await new Promise(r => setTimeout(r, 2500));
            
            const statusRes = await client.get(`${BASE}/generate-image/status?taskId=${generateRes.data.taskId}`);
            
            if (statusRes.data.status === "completed" && statusRes.data.imageUrl) {
                resultUrl = statusRes.data.imageUrl;
                waiting = false;
            } else if (statusRes.data.status === "failed") {
                throw new Error("Generation failed");
            }
        }

        // Send result
        await conn.sendMessage(from, { 
            image: { url: resultUrl }, 
            caption: `*🎨 AI Edit Completed*\n\n*Prompt:* ${text}`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Error:", e);
        reply(`❌ Error: ${e.message}`);
    } finally {
        // Cleanup
        if (client) {
            client = null;
        }
    }
});
