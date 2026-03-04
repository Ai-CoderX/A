const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "ai",
    desc: "Chat with General AI",
    category: "ai",
    react: "🧠",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for AI");

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=You are a general AI assistant. Provide helpful, accurate, and friendly responses.`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Error fetching response. Please try again later.");
        }

        await reply(data.results);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("An error occurred. Please try again.");
    }
});
