const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// API parts split to hide from skiddies
const api = {
    https: "https://",
    domain1: "img",
    domain2: "editor",
    tld: ".co",
    path: "/api"
};

// Build base URL from parts
const BASE = api.https + api.domain1 + api.domain2 + api.tld + api.path;

// Build referer from parts
const REFERER = api.https + api.domain1 + api.domain2 + api.tld + "/generator";
const ORIGIN = api.https + api.domain1 + api.domain2 + api.tld;

// Create ONE fresh client for the entire command
function createFreshClient() {
    return axios.create({
        headers: {
            "accept": "*/*",
            "accept-language": "id-ID",
            "content-type": "application/json",
            "origin": ORIGIN,
            "referer": REFERER,
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
        }
    });
}

/**
 * Upload Image Buffer to ImgEditor
 */
async function uploadImage(buffer, client) {
    const uploadEndpoint = `${BASE}/get-upload-url`;
    
    const res = await client.post(uploadEndpoint, {
        fileName: "image.jpg",
        contentType: "image/jpeg",
        fileSize: buffer.length
    });

    const json = res.data;
    if (!json.uploadUrl || !json.publicUrl) throw new Error("Gagal mendapatkan upload url");

    await axios.put(json.uploadUrl, buffer, {
        headers: { "content-type": "image/jpeg" }
    });

    return json.publicUrl;
}

/**
 * Request AI Image Generation
 */
async function generateImage(prompt, imageUrl, client) {
    const generateEndpoint = `${BASE}/generate-image`;
    
    const res = await client.post(generateEndpoint, {
        prompt,
        styleId: "realistic",
        mode: "image",
        imageUrl,
        imageUrls: [imageUrl],
        numImages: 1,
        outputFormat: "png",
        model: "nano-banana"
    });

    if (!res.data.taskId) throw new Error("Task creation failed");
    return res.data.taskId;
}

/**
 * Wait for AI Task Completion
 */
async function waitResult(taskId, client) {
    const statusEndpoint = `${BASE}/generate-image/status?taskId=${taskId}`;
    
    while (true) {
        await new Promise(r => setTimeout(r, 2500));
        const res = await client.get(statusEndpoint);
        const json = res.data;

        if (json.status === "completed" && json.imageUrl) return json.imageUrl;
        if (json.status === "failed") throw new Error("Generation failed");
    }
}

// --- COMMAND: EDIT IMAGE ---
cmd({
    pattern: "editimg",
    alias: ["edit", "imageedit"],
    desc: "Edit an image using AI prompt.",
    category: "ai",
    react: "🚀",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    // Create ONE fresh client for this entire command
    const client = createFreshClient();
    
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!/image/.test(mime)) return reply("📸 Please reply to an image with a prompt.\nExample: `.editimg change to a robot` ");
        if (!text) return reply("❓ Please provide a prompt for AI.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // 1. Download and Upload - use same client
        const mediaBuffer = await q.download();
        const publicUrl = await uploadImage(mediaBuffer, client);
        
        // 2. Generate Task - use same client
        const taskId = await generateImage(text, publicUrl, client);
        
        // 3. Wait for result - use same client
        const resultUrl = await waitResult(taskId, client);

        await conn.sendMessage(from, { 
            image: { url: resultUrl }, 
            caption: `*🎨 AI Edit Completed*\n\n*Prompt:* ${text}\n\n*🚀 Powered by JAWAD-MD*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("AI Editor Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
    
    // Client gets discarded after command ends
    // Next command gets fresh new client = new session = new 1-generation token
});
