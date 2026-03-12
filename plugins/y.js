// ✅ Coded by  for 
// 🐳 Direct Docker Download - Uses the specific image digest

const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

cmd({
    pattern: "y",
    desc: "Download WASI bot directly from Docker",
    category: "download",
    react: "🐳",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    
    try {
        const msg = await reply("🐳 *WASI DOCKER DOWNLOADER*\n\n⏳ Connecting to Docker Hub...");

        // Configuration - Using the exact digest from your manifest
        const config = {
            image: "mrwasi/wasimdv7",
            tag: "latest",
            // The amd64 manifest digest from your link
            manifestDigest: "sha256:d4189896ecbce36480412af72032afae9509339ee7bb4dc3e788dd72cf7c49d6",
            // Token URL
            authUrl: "https://auth.docker.io/token?service=registry.docker.io&scope=repository:mrwasi/wasimdv7:pull"
        };

        // Step 1: Get authentication token
        await reply("🔑 Step 1/6: Authenticating with Docker Hub...");
        const auth = await axios.get(config.authUrl);
        const token = auth.data.token;

        // Step 2: Get the specific manifest using digest
        await reply("📋 Step 2/6: Fetching image manifest...");
        const manifestUrl = `https://registry-1.docker.io/v2/${config.image}/manifests/${config.manifestDigest}`;
        
        const manifestRes = await axios.get(manifestUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.docker.distribution.manifest.v2+json'
            }
        });

        const manifest = manifestRes.data;
        const layers = manifest.layers || [];
        
        await reply(`📦 Found ${layers.length} layers to download`);

        // Create temp directory
        const tempDir = path.join(__dirname, '../temp_docker');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const extractDir = path.join(tempDir, 'extracted');
        if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

        // Step 3: Download and extract each layer
        let botFiles = [];
        
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            const digest = layer.digest;
            
            await reply(`📥 Step 3/6: Downloading layer ${i+1}/${layers.length}...`);

            // Download layer
            const layerUrl = `https://registry-1.docker.io/v2/${config.image}/blobs/${digest}`;
            const layerRes = await axios({
                method: 'get',
                url: layerUrl,
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'arraybuffer'
            });

            const layerData = layerRes.data;
            
            // Look for bot files in this layer
            const layerStr = layerData.toString('utf-8', 0, Math.min(layerData.length, 50000));
            
            // Check for important bot files
            const importantFiles = [
                'index.js', 'wasi.js', 'package.json', 
                'wasiplugins/', 'wasilib/', 'plugins/',
                'config.js', 'main.js', 'app.js'
            ];
            
            for (const file of importantFiles) {
                if (layerStr.includes(file)) {
                    botFiles.push(`Layer ${i+1}: ${file}`);
                }
            }

            // Save raw layer for manual extraction (optional)
            const layerPath = path.join(tempDir, `layer-${i+1}.bin`);
            fs.writeFileSync(layerPath, layerData);
        }

        // Step 4: Create a comprehensive info package
        await reply("📦 Step 4/6: Creating download package...");

        const zip = new AdmZip();

        // Add manifest
        zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2)));

        // Add layer URLs
        const layerUrls = layers.map((l, i) => 
            `Layer ${i+1}: https://registry-1.docker.io/v2/${config.image}/blobs/${l.digest}`
        ).join('\n');
        
        zip.addFile('LAYER_URLS.txt', Buffer.from(layerUrls));

        // Add detected files info
        zip.addFile('DETECTED_FILES.txt', Buffer.from(
            `Files detected in Docker layers:\n${botFiles.join('\n')}`
        ));

        // Add extraction guide
        zip.addFile('EXTRACT_GUIDE.txt', Buffer.from(`
═══════════════════════════════════════════
WASI-MD V7 - Docker Image Extraction Guide
═══════════════════════════════════════════

Image: ${config.image}:${config.tag}
Digest: ${config.manifestDigest}
Date: ${new Date().toISOString()}

📥 HOW TO GET ACTUAL BOT FILES:
─────────────────────────────────

METHOD 1: Using Docker (Easiest)
─────────────────────────────────
1. Install Docker on your PC
2. Run: docker pull mrwasi/wasimdv7:latest
3. Run: docker create --name temp mrwasi/wasimdv7:latest
4. Run: docker cp temp:/app ./wasi-bot-source
5. Run: docker rm temp
6. The bot files will be in ./wasi-bot-source/

─────────────────────────────────
METHOD 2: Manual Extraction (No Docker)
─────────────────────────────────
1. Download all layers using the URLs in LAYER_URLS.txt
2. You'll need:
   - tar/gzip on Linux/Mac
   - 7-Zip on Windows
3. Extract each layer: tar -xzf layer-*.bin
4. Look for the /app directory in extracted files
5. Copy all files from /app to a folder

─────────────────────────────────
LAYER CONTENTS (Detected):
─────────────────────────────────
${botFiles.join('\n')}

─────────────────────────────────
TYPICAL BOT STRUCTURE:
─────────────────────────────────
📁 app/
  ├── 📄 index.js        # Main bot file
  ├── 📄 wasi.js         # Core code
  ├── 📄 package.json    # Dependencies
  ├── 📁 wasiplugins/    # All commands! 🔥
  ├── 📁 wasilib/        # Libraries
  ├── 📁 public/         # Web files
  └── 📁 assets/         # Media files

─────────────────────────────────
NOTE: The actual source files are inside the layers.
This package contains everything needed to get them.
        `));

        // Add a simple placeholder structure
        zip.addFile('README.txt', Buffer.from(`
WASI-MD V7 - Docker Source Package
==================================
This package contains the Docker image metadata and layer URLs.
To get the actual bot source code, follow the instructions in EXTRACT_GUIDE.txt
        `));

        const zipPath = path.join(__dirname, '../WASI-DOCKER-SOURCE.zip');
        zip.writeZip(zipPath);

        const stats = fs.statSync(zipPath);
        const fileSize = (stats.size / 1024).toFixed(2);

        // Step 5: Send the package
        await reply("📤 Step 5/6: Preparing to send...");

        await conn.sendMessage(from, {
            document: fs.readFileSync(zipPath),
            mimetype: 'application/zip',
            fileName: `WASI-BOT-DOCKER-${Date.now()}.zip`,
            caption: `✅ *DOWNLOAD PACKAGE READY!*\n\n` +
                    `🐳 *Image:* ${config.image}:${config.tag}\n` +
                    `📦 *Layers:* ${layers.length}\n` +
                    `📊 *Package Size:* ${fileSize} KB\n` +
                    `🔍 *Bot Files Detected:* ${botFiles.length}\n\n` +
                    `📁 *Package Contains:*\n` +
                    `• Complete image manifest\n` +
                    `• Direct layer download URLs\n` +
                    `• Detailed extraction guide\n` +
                    `• File detection results\n\n` +
                    `⚡ *To get actual bot source:*\n` +
                    `1. Extract this ZIP\n` +
                    `2. Read EXTRACT_GUIDE.txt\n` +
                    `3. Use Docker or manual method\n\n` +
                    `🔥 *Main files to look for:*\n` +
                    `• index.js - Main bot\n` +
                    `• wasiplugins/ - All commands!\n` +
                    `• wasilib/ - Core libraries\n\n` +
                    `> *Direct from Docker Hub - ${new Date().toLocaleString()}*`
        }, { quoted: mek });

        // Step 6: Clean up
        await reply("🧹 Step 6/6: Cleaning up...");
        
        setTimeout(() => {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
                fs.unlinkSync(zipPath);
            } catch (e) {}
        }, 120000);

        // Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error("Download error:", error);
        await reply(`❌ *Error:* ${error.message}\n\nTry again or contact support.`);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
