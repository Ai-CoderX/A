// Add these imports at the top of your file with your other requires
const path = require('path');
const os = require('os');
const fsSync = require('fs');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys'); // or wherever you get this from

/**
 * Download media as stream and save to temp file
 * @param {Object} message - The message object containing media
 * @param {string} filename - Optional custom filename
 * @returns {Promise<string>} - Path to the saved temp file
 */
const downloadMediaAsStream = async (message, filename = null) => {
  try {
    const mime = (message.msg || message).mimetype || "";
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
    
    // Get download stream
    const stream = await downloadContentFromMessage(message, messageType);
    
    // Create temp file name
    const ext = mime.split('/')[1] || 'bin';
    const tempFileName = filename || `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const tempFilePath = path.join(os.tmpdir(), "cache-temp", tempFileName);
    
    // Ensure temp directory exists
    const tempDir = path.join(os.tmpdir(), "cache-temp");
    if (!fsSync.existsSync(tempDir)) {
      fsSync.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create write stream
    const writeStream = fsSync.createWriteStream(tempFilePath);
    
    // Pipe the download stream to file
    return new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        console.log(`[✅] Stream saved: ${tempFilePath}`);
        resolve(tempFilePath);
      });
      
      writeStream.on('error', (err) => {
        console.error('[❌] Stream write error:', err);
        reject(err);
      });
      
      stream.on('error', (err) => {
        console.error('[❌] Stream download error:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('[❌] downloadMediaAsStream error:', error);
    return null;
  }
};

/**
 * Download from URL as stream
 * @param {string} url - The URL to download from
 * @param {string} filename - Optional custom filename
 * @returns {Promise<string>} - Path to the saved temp file
 */
const getStreamFromUrl = async (url, filename = null) => {
  try {
    // Get file extension from URL or default
    const ext = url.split('.').pop().split('?')[0] || 'bin';
    const tempFileName = filename || `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const tempFilePath = path.join(os.tmpdir(), "cache-temp", tempFileName);
    
    // Ensure temp directory exists
    const tempDir = path.join(os.tmpdir(), "cache-temp");
    if (!fsSync.existsSync(tempDir)) {
      fsSync.mkdirSync(tempDir, { recursive: true });
    }
    
    // Download as stream
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000
    });
    
    const writeStream = fsSync.createWriteStream(tempFilePath);
    
    return new Promise((resolve, reject) => {
      response.data.pipe(writeStream);
      
      writeStream.on('finish', () => {
        console.log(`[✅] URL stream saved: ${tempFilePath}`);
        resolve(tempFilePath);
      });
      
      writeStream.on('error', reject);
      response.data.on('error', reject);
    });
  } catch (error) {
    console.error('[❌] getStreamFromUrl error:', error);
    return null;
  }
};

/**
 * Read file and send as stream (for sending large files)
 * @param {Object} conn - The connection object
 * @param {string} jid - The JID to send to
 * @param {string} filePath - Path to the file
 * @param {string} caption - Optional caption
 * @param {Object} quoted - Optional quoted message
 * @returns {Promise}
 */
const sendFileAsStream = async (conn, jid, filePath, caption = '', quoted = null) => {
  try {
    const fileStat = fsSync.statSync(filePath);
    const fileSize = fileStat.size;
    
    console.log(`[📤] Sending stream: ${filePath} (${Math.round(fileSize/1024/1024)}MB)`);
    
    // Determine file type
    const mimeType = path.extname(filePath).toLowerCase();
    let messageType = 'document';
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(mimeType)) {
      messageType = 'image';
    } else if (['.mp4', '.mov', '.avi'].includes(mimeType)) {
      messageType = 'video';
    } else if (['.mp3', '.wav', '.ogg'].includes(mimeType)) {
      messageType = 'audio';
    }
    
    // Create read stream and send
    const readStream = fsSync.createReadStream(filePath);
    
    const message = {
      [messageType]: readStream,
      caption: caption
    };
    
    await conn.sendMessage(jid, message, { quoted });
    
    // Don't delete here - let the cleanup interval handle it
    return true;
  } catch (error) {
    console.error('[❌] sendFileAsStream error:', error);
    return false;
  }
};

/**
 * Clean up old temp files
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 */
const cleanupTempFiles = (maxAgeMs = 5 * 60 * 1000) => {
  try {
    const tempDir = path.join(os.tmpdir(), "cache-temp");
    if (!fsSync.existsSync(tempDir)) return;
    
    const files = fsSync.readdirSync(tempDir);
    const now = Date.now();
    let deleted = 0;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      try {
        const stats = fsSync.statSync(filePath);
        const fileAge = now - stats.mtimeMs;
        
        if (fileAge > maxAgeMs) {
          fsSync.unlinkSync(filePath);
          deleted++;
        }
      } catch (e) {
        // Ignore errors for individual files
      }
    });
    
    if (deleted > 0) {
      console.log(`[🧹] Cleaned up ${deleted} old temp files`);
    }
  } catch (error) {
    console.error('[❌] cleanupTempFiles error:', error);
  }
};

// Auto cleanup every 5 minutes
setInterval(() => cleanupTempFiles(), 5 * 60 * 1000);

// Export the functions
module.exports = {
  downloadMediaAsStream,
  getStreamFromUrl,
  sendFileAsStream,
  cleanupTempFiles
};
