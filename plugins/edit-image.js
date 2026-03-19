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

// Strict cleanup function
function strictCleanup(...instances) {
    instances.forEach(instance => {
        if (instance) {
            // Clear all headers
            if (instance.defaults) instance.defaults.headers = {};
            
            // Clear all interceptors
            if (instance.interceptors) {
                if (instance.interceptors.request) instance.interceptors.request.clear();
                if (instance.interceptors.response) instance.interceptors.response.clear();
            }
            
            // Delete all properties
            for (let prop in instance) {
                delete instance[prop];
            }
        }
    });
}

cmd({
    pattern: "editimg",
    alias: ["edit", "imageedit"],
    desc: "Edit an image using AI prompt.",
    category: "ai",
    react: "🚀",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    
    // Declare all instances at top
    let cookieGrabber = null;
    let worker = null;
    let uploadClient = null;
    
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        
        if (!/image/.test(mime)) return reply("📸 Please reply to an image with a prompt.");
        if (!text) return reply("❓ Please provide a prompt.");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        
        // ===== STEP 1: Get fresh cookies =====
        cookieGrabber = axios.create({
            headers: {
                "accept": "*/*",
                "accept-language": "id-ID",
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
            }
        });
        
        await cookieGrabber.get(REFERER);
        const cookies = cookieGrabber.defaults.headers?.Cookie || '';
        
        // STRICTLY CLEAN cookieGrabber NOW
        strictCleanup(cookieGrabber);
        cookieGrabber = null;
        
        // ===== STEP 2: Create worker =====
        worker = axios.create({
            headers: {
                "accept": "*/*",
                "accept-language": "id-ID",
                "content-type": "application/json",
                "origin": ORIGIN,
                "referer": REFERER,
                "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
                "Cookie": cookies
            }
        });
        
        // ===== STEP 3: Upload =====
        const mediaBuffer = await q.download();
        
        const uploadRes = await worker.post(`${BASE}/get-upload-url`, {
            fileName: "image.jpg",
            contentType: "image/jpeg",
            fileSize: mediaBuffer.length
        });

        if (!uploadRes.data.uploadUrl || !uploadRes.data.publicUrl) {
            throw new Error("Upload failed");
        }

        // Use separate client for PUT upload
        uploadClient = axios.create();
        await uploadClient.put(uploadRes.data.uploadUrl, mediaBuffer, {
            headers: { "content-type": "image/jpeg" }
        });
        
        // CLEAN uploadClient immediately
        strictCleanup(uploadClient);
        uploadClient = null;
        
        const publicUrl = uploadRes.data.publicUrl;
        
        // ===== STEP 4: Generate =====
        const generateRes = await worker.post(`${BASE}/generate-image`, {
            prompt: text,
            styleId: "realistic",
            mode: "image",
            imageUrl: publicUrl,
            imageUrls: [publicUrl],
            numImages: 1,
            outputFormat: "png",
            model: "nano-banana"
        });

        if (!generateRes.data.taskId) throw new Error("Task creation failed");
        const taskId = generateRes.data.taskId;
        
        // ===== STEP 5: Wait for result =====
        let resultUrl = null;
        let waiting = true;
        
        while (waiting) {
            await new Promise(r => setTimeout(r, 2500));
            
            const statusRes = await worker.get(`${BASE}/generate-image/status?taskId=${taskId}`);
            
            if (statusRes.data.status === "completed" && statusRes.data.imageUrl) {
                resultUrl = statusRes.data.imageUrl;
                waiting = false;
            } else if (statusRes.data.status === "failed") {
                throw new Error("Generation failed");
            }
        }
        
        // ===== STRICT CLEANUP BEFORE SENDING =====
        // Clear cookies
        if (worker && worker.defaults && worker.defaults.headers) {
            delete worker.defaults.headers.Cookie;
        }
        
        // Clean worker
        strictCleanup(worker);
        worker = null;
        
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
        // FINAL CLEANUP - kill everything
        strictCleanup(cookieGrabber, worker, uploadClient);
        cookieGrabber = null;
        worker = null;
        uploadClient = null;
    }
});
