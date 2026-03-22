const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: "slist",
    desc: "Send session files list as a .js file",
    category: "owner",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isCreator, reply }) => {
    try {
        // Check if user is owner
        if (!isCreator) {
            return await reply("❌ This command is only for the bot owner!");
        }

        // Path to session folder
        const sessionPath = path.join(__dirname, '../sessions');
        
        // Check if session folder exists
        if (!fs.existsSync(sessionPath)) {
            return await reply("❌ Session folder not found!");
        }

        // Get all files from sessions folder
        const files = fs.readdirSync(sessionPath);
        
        // Filter .js and .json files
        const jsFiles = files.filter(file => file.endsWith('.js'));
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        // Combine all files
        const allFiles = [...jsFiles, ...jsonFiles];
        
        if (allFiles.length === 0) {
            return await reply("📂 No .js or .json files found in session folder!");
        }
        
        // Create formatted list content
        let fileListContent = "📁 SESSION FILES LIST\n\n";
        fileListContent += "━━━━━━━━━━━━━━━━━━\n\n";
        
        // Add JavaScript files section
        if (jsFiles.length > 0) {
            fileListContent += "📜 JavaScript Files:\n";
            jsFiles.forEach((file, index) => {
                const filePath = path.join(sessionPath, file);
                const stats = fs.statSync(filePath);
                const size = (stats.size / 1024).toFixed(2);
                fileListContent += `${index + 1}. ${file} (${size} KB)\n`;
            });
            fileListContent += "\n";
        }
        
        // Add JSON files section
        if (jsonFiles.length > 0) {
            fileListContent += "📄 JSON Files:\n";
            jsonFiles.forEach((file, index) => {
                const filePath = path.join(sessionPath, file);
                const stats = fs.statSync(filePath);
                const size = (stats.size / 1024).toFixed(2);
                fileListContent += `${index + 1}. ${file} (${size} KB)\n`;
            });
            fileListContent += "\n";
        }
        
        fileListContent += "━━━━━━━━━━━━━━━━━━\n";
        fileListContent += `📊 Total Files: ${allFiles.length}\n`;
        fileListContent += `📦 Total Size: ${calculateTotalSize(sessionPath, allFiles)} KB\n`;
        fileListContent += "\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ Jᴀᴡᴀᴅ TᴇᴄʜX*";
        
        // Create temporary directory if it doesn't exist
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `session_list_${timestamp}.js`;
        const filePath = path.join(tempDir, fileName);
        
        // Write content to .js file
        const fileContent = `// Session Files List - Generated on ${new Date().toLocaleString()}\n// Total Files: ${allFiles.length}\n\n/*\n${fileListContent}\n*/`;
        fs.writeFileSync(filePath, fileContent, 'utf8');
        
        // Send the file
        await conn.sendMessage(from, {
            document: { url: filePath },
            fileName: fileName,
            mimetype: 'application/javascript',
            caption: `✅ *Session Files List*\n\n📁 *File:* ${fileName}\n📊 *Total Files:* ${allFiles.length}\n📦 *Total Size:* ${calculateTotalSize(sessionPath, allFiles)} KB\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ Jᴀᴡᴀᴅ TᴇᴄʜX*`
        }, { quoted: mek });
        
        // Delete the file after sending (optional)
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error("Error deleting temp file:", err);
            }
        }, 60000); // Delete after 1 minute
        
        // React with success
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        
    } catch (e) {
        console.error("❌ Error in .listsession command:", e);
        await reply("⚠️ Something went wrong while creating session file list!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// Helper function to calculate total size
function calculateTotalSize(folderPath, files) {
    let totalSize = 0;
    files.forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
    });
    return (totalSize / 1024).toFixed(2);
}
