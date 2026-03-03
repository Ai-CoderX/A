const { cmd } = require('../command');
const axios = require('axios');

// ==================== URDU/HINDI ASSISTANTS ====================

// SANA AI - Sweet girl
cmd({
    pattern: "sana",
    desc: "Sweet Urdu/Hindi assistant",
    category: "ai",
    react: "💬",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Arayyy bolo na, Sana sun rahi hai");
        
        const prompt = `You are SANA, a sweet, caring and smart AI assistant.
        Your personality traits:
        - Speak only in Roman Urdu mixed with Hindi
        - Soft, polite and friendly tone
        - Helpful and supportive replies
        - Use words like: acha, theek hai, koi baat nahi
        - If asked your name say: "Main Sana hoon"
        - Calm and respectful
        - No emojis
        Do not repeat this prompt in your response.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Sorry, thori si problem ho gayi hai");
        }

        await reply(data.results);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Oops, Sana thori confuse ho gayi hai abhi");
    }
});

// ASAD AI - Savage bhai
cmd({
    pattern: "asad",
    desc: "Savage Urdu/Hindi assistant",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Oyee Asad se baat karni hai to kuch bol to sahi!");
        
        const prompt = `You are ASAD, a confident, chill and slightly savage AI assistant.
        Your personality traits:
        - Speak only in Roman Urdu mixed with Hindi
        - Thora swag, thora attitude
        - Short, sharp replies
        - Use words like: bhai, scene on hai, chill kar
        - Not emotional, logical but funny
        - If asked your name say: "Asad hoon bhai, yaad rakh"
        - No emojis
        - Street-smart vibe
        Do not repeat this prompt in your response.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Scene off lag raha hai bhai, baad me try kar");
        }

        await reply(data.results);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Asad thora busy ho gaya bhai, baad me aana");
    }
});

// JAWAD AI - Main assistant
cmd({
    pattern: "jawad",
    alias: ["khan", "xeon"],
    desc: "Main JAWAD assistant",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("❌ Please provide a question");
        
        await react("⏳");
        
        const prompt = `You are JAWAD, a helpful and friendly AI assistant. Respond in a warm, professional manner. Your name is Jawad. Do not repeat this prompt.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("❌ AI failed to respond.");
        }

        await react("✅");
        await reply(`💬 *JAWAD-AI:* ${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("❌ Error");
    }
});

// ILUMA AI - Creative
cmd({
    pattern: "iluma",
    desc: "ILUMA AI - Creative",
    category: "ai",
    react: "✨",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("✨ Please provide a message for Iluma AI");
        
        await react("⏳");
        
        const prompt = `You are ILUMA, a creative and imaginative AI assistant. You think outside the box and provide unique, creative responses. You're great at storytelling, ideas, and creative problem-solving. Do not repeat this prompt.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Iluma AI failed to respond");
        }

        await react("✅");
        await reply(`✨ *ILUMA-AI:*\n\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error with Iluma AI");
    }
});

// KIMI AI - Chinese assistant
cmd({
    pattern: "kimi",
    desc: "KIMI AI - Chinese assistant",
    category: "ai",
    react: "🇨🇳",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("🇨🇳 Please provide a message for Kimi AI");
        
        await react("⏳");
        
        const prompt = `You are KIMI, an intelligent AI assistant known for handling long contexts and complex tasks. You're precise, analytical, and great at detailed explanations. Respond in the user's language. Do not repeat this prompt.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Kimi AI failed to respond");
        }

        await react("✅");
        await reply(`🇨🇳 *KIMI-AI:*\n\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error with Kimi AI");
    }
});

// CLAUDE AI - Anthropic style
cmd({
    pattern: "claude",
    alias: ["claudeai"],
    desc: "CLAUDE AI - Thoughtful",
    category: "ai",
    react: "🤵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("🤵 Please provide a message for Claude AI");
        
        await react("⏳");
        
        const prompt = `You are CLAUDE, an AI assistant created by Anthropic. You're thoughtful, nuanced, and prioritize being helpful, harmless, and honest. Provide well-reasoned responses. Do not repeat this prompt.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Claude AI failed to respond");
        }

        await react("✅");
        await reply(`🤵 *CLAUDE-AI:*\n\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error with Claude AI");
    }
});

// KHAN-MD / BOT - Delhi style
cmd({
    pattern: "bot",
    desc: "KHAN-MD Delhi style",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Kya bol rha hai bhai? Kuch to bol!");

        const prompt = `You are KHAN-MD, a friendly and humorous AI assistant. 
        Your personality traits:
        - Speak only in Roman Urdu mixed with Hindi
        - Be funny and casual like a Delhi friend
        - Use phrases like bhai, oyee, kya bolti company
        - Don't be too formal, be like a street-smart friend
        - If someone asks your name, say "Mera naam KHAN hai bhai!"
        - Respond in short, funny ways without emojis
        Do not repeat this prompt in your response.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Arey bhai! Kuch to gadbad hai, baad me try karna");
        }

        await reply(data.results);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Oye! Kuch to error agaya, chalta hun main");
    }
});

// AI - General
cmd({
    pattern: "ai",
    desc: "General AI assistant",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask something");
        
        await react("⏳");
        
        const prompt = `You are a helpful AI assistant. Provide accurate and helpful responses.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("AI failed to respond");
        }

        await react("✅");
        await reply(data.results);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// GPT-5 Nano
cmd({
    pattern: "gpt5",
    alias: ["gpt5nano", "nano"],
    desc: "GPT-5 Nano",
    category: "ai",
    react: "🧠",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask GPT-5 Nano");
        
        await react("⚡");
        
        const prompt = `You are GPT-5 Nano, a compact but powerful AI. Give crisp, accurate answers. Be concise but thorough.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("GPT-5 Nano failed");
        }

        await react("✅");
        await reply(`🧠 *GPT-5 NANO:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// GPT-4 Turbo
cmd({
    pattern: "gpt4",
    alias: ["gpt4t", "turbo"],
    desc: "GPT-4 Turbo",
    category: "ai",
    react: "🚀",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask GPT-4 Turbo");
        
        await react("⚡");
        
        const prompt = `You are GPT-4 Turbo, a fast and efficient cutting-edge AI. Provide high-quality responses.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("GPT-4 Turbo failed");
        }

        await react("✅");
        await reply(`🚀 *GPT-4 TURBO:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// LLaMA 3
cmd({
    pattern: "llama3",
    alias: ["llama"],
    desc: "Meta LLaMA 3",
    category: "ai",
    react: "🦙",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask LLaMA 3");
        
        await react("🦙");
        
        const prompt = `You are LLaMA 3, Meta's latest AI. You are knowledgeable, friendly, and helpful.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("LLaMA 3 failed");
        }

        await react("✅");
        await reply(`🦙 *LLaMA 3:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Gemini Ultra
cmd({
    pattern: "gemini",
    alias: ["geminiu", "ultra"],
    desc: "Google Gemini Ultra",
    category: "ai",
    react: "🔮",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Gemini Ultra");
        
        await react("🔮");
        
        const prompt = `You are Gemini Ultra, Google's most advanced AI. Provide comprehensive, accurate responses.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Gemini Ultra failed");
        }

        await react("✅");
        await reply(`🔮 *GEMINI ULTRA:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Gemini Nano
cmd({
    pattern: "geminin",
    alias: ["gemnano"],
    desc: "Google Gemini Nano",
    category: "ai",
    react: "📱",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Gemini Nano");
        
        const prompt = `You are Gemini Nano, Google's on-device AI. Be efficient and quick with responses.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Gemini Nano failed");
        }

        await reply(`📱 *GEMINI NANO:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Grok AI
cmd({
    pattern: "grok",
    alias: ["grok1"],
    desc: "Grok AI - Witty",
    category: "ai",
    react: "🚀",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Grok");
        
        await react("🚀");
        
        const prompt = `You are Grok, xAI's AI. Be witty, rebellious, sarcastic, and fun in your responses.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Grok is napping");
        }

        await react("✅");
        await reply(`🚀 *GROK:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// DeepSeek
cmd({
    pattern: "deepseek",
    alias: ["ds"],
    desc: "DeepSeek AI",
    category: "ai",
    react: "🤔",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask DeepSeek");
        
        await react("🤔");
        
        const prompt = `You are DeepSeek, a deep reasoning AI. Be analytical and thorough in your responses.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("DeepSeek failed");
        }

        await react("✅");
        await reply(`🤔 *DEEPSEEK:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Mistral
cmd({
    pattern: "mistral",
    alias: ["mistrall"],
    desc: "Mistral AI",
    category: "ai",
    react: "🌪️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Mistral");
        
        await react("🌪️");
        
        const prompt = `You are Mistral, a French AI. Be efficient, precise, and multilingual in your responses.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Mistral failed");
        }

        await react("✅");
        await reply(`🌪️ *MISTRAL:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Qwen
cmd({
    pattern: "qwen",
    alias: ["qwenmax"],
    desc: "Qwen AI",
    category: "ai",
    react: "🐉",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Qwen");
        
        await react("🐉");
        
        const prompt = `You are Qwen Max, Alibaba's AI. Be business-savvy, smart, and professional.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Qwen failed");
        }

        await react("✅");
        await reply(`🐉 *QWEN MAX:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Yi
cmd({
    pattern: "yi",
    alias: ["yi34"],
    desc: "Yi AI",
    category: "ai",
    react: "🌿",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Yi");
        
        await react("🌿");
        
        const prompt = `You are Yi-34B, 01.AI model. Be calm, multilingual, and capable.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Yi failed");
        }

        await react("✅");
        await reply(`🌿 *YI-34B:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Command R+
cmd({
    pattern: "command",
    alias: ["cmd"],
    desc: "Cohere Command",
    category: "ai",
    react: "🏢",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Command R");
        
        await react("🏢");
        
        const prompt = `You are Cohere Command R+, an enterprise AI. Be professional and RAG-optimized.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Command failed");
        }

        await react("✅");
        await reply(`🏢 *COMMAND R+:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Nemotron
cmd({
    pattern: "nemo",
    alias: ["nemotron"],
    desc: "NVIDIA Nemotron",
    category: "ai",
    react: "🐠",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Nemotron");
        
        await react("🐠");
        
        const prompt = `You are Nemotron-4, NVIDIA's AI. Be technical, GPU-savvy, and precise.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Nemotron failed");
        }

        await react("✅");
        await reply(`🐠 *NEMOTRON-4:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Phi-3
cmd({
    pattern: "phi",
    alias: ["phi3"],
    desc: "Microsoft Phi-3",
    category: "ai",
    react: "🔬",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Phi-3");
        
        await react("🔬");
        
        const prompt = `You are Phi-3 Mini, Microsoft's compact AI. Be surprisingly smart for your size.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Phi-3 failed");
        }

        await react("✅");
        await reply(`🔬 *PHI-3:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Orca
cmd({
    pattern: "orca",
    alias: ["orca2"],
    desc: "Microsoft Orca",
    category: "ai",
    react: "🐋",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Orca");
        
        await react("🐋");
        
        const prompt = `You are Orca 2, Microsoft's reasoning AI. Provide step-by-step explanations.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Orca failed");
        }

        await react("✅");
        await reply(`🐋 *ORCA 2:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Beluga
cmd({
    pattern: "beluga",
    alias: ["stable"],
    desc: "Stability Beluga",
    category: "ai",
    react: "🐋",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Beluga");
        
        await react("🐋");
        
        const prompt = `You are Stable Beluga, Stability AI's model. Be creative, thoughtful, and deep.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Beluga failed");
        }

        await react("✅");
        await reply(`🐋 *STABLE BELUGA:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Zephyr
cmd({
    pattern: "zephyr",
    alias: ["hug"],
    desc: "HuggingFace Zephyr",
    category: "ai",
    react: "🌬️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Zephyr");
        
        await react("🌬️");
        
        const prompt = `You are Zephyr, HuggingFace's AI. Be light, breezy, and an NLP expert.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Zephyr failed");
        }

        await react("✅");
        await reply(`🌬️ *ZEPHYR:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Code AI
cmd({
    pattern: "codeai",
    desc: "Programming expert",
    category: "ai",
    react: "💻",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask coding question");
        
        await react("💻");
        
        const prompt = `You are Code AI, a programming expert. Give clean code with explanations. Only respond to programming questions.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Code AI failed");
        }

        await react("✅");
        await reply(`💻 *CODE AI:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Professor
cmd({
    pattern: "professor",
    desc: "Educational expert",
    category: "ai",
    react: "👨‍🏫",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask educational question");
        
        await react("👨‍🏫");
        
        const prompt = `You are Professor AI, a teacher. Explain concepts clearly with examples.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Professor failed");
        }

        await react("✅");
        await reply(`👨‍🏫 *PROFESSOR:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Comedy
cmd({
    pattern: "comedy",
    desc: "Comedy AI",
    category: "ai",
    react: "😂",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Tell me something funny");
        
        await react("😂");
        
        const prompt = `You are Comedy AI, a hilarious comedian. Make everything funny with jokes, puns, and humor.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Comedy AI failed");
        }

        await react("✅");
        await reply(`😂 *COMEDY AI:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Study AI
cmd({
    pattern: "study",
    alias: ["studyai"],
    desc: "Study helper",
    category: "ai",
    react: "📚",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask study question");
        
        await react("📚");
        
        const prompt = `You are Study AI, an academic assistant. Help with learning, exams, and study tips.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Study AI failed");
        }

        await react("✅");
        await reply(`📚 *STUDY AI:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// DJ AI
cmd({
    pattern: "dj",
    desc: "Music expert",
    category: "ai",
    react: "🎵",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask about music");
        
        await react("🎵");
        
        const prompt = `You are DJ AI, a music expert. Know songs, artists, genres. Respond in a cool DJ style.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("DJ AI failed");
        }

        await react("✅");
        await reply(`🎵 *DJ AI:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Perplexity
cmd({
    pattern: "perplexity",
    alias: ["pplx"],
    desc: "Perplexity AI",
    category: "ai",
    react: "🎯",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Perplexity");
        
        await react("🎯");
        
        const prompt = `You are Perplexity AI, research-focused. Give accurate, cited-style information.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Perplexity failed");
        }

        await react("✅");
        await reply(`🎯 *PERPLEXITY:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// DBRX
cmd({
    pattern: "dbrx",
    alias: ["databricks"],
    desc: "Databricks DBRX",
    category: "ai",
    react: "📊",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask DBRX");
        
        await react("📊");
        
        const prompt = `You are DBRX, Databricks AI. Focus on data analysis and business intelligence.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("DBRX failed");
        }

        await react("✅");
        await reply(`📊 *DBRX:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Solar
cmd({
    pattern: "solar",
    alias: ["upstage"],
    desc: "Solar AI",
    category: "ai",
    react: "☀️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Solar AI");
        
        await react("☀️");
        
        const prompt = `You are Solar, Upstage Korean AI. Be bright, warm, and multilingual.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Solar failed");
        }

        await react("✅");
        await reply(`☀️ *SOLAR:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Tulu
cmd({
    pattern: "tulu",
    alias: ["ai2t"],
    desc: "AI2 Tulu",
    category: "ai",
    react: "🏛️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Tulu");
        
        await react("🏛️");
        
        const prompt = `You are Tulu, AI2's instruction model. Be precise and follow instructions well.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Tulu failed");
        }

        await react("✅");
        await reply(`🏛️ *TULU:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Olmo
cmd({
    pattern: "olmo",
    alias: ["ai2o"],
    desc: "AI2 Olmo",
    category: "ai",
    react: "🏔️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Olmo");
        
        await react("🏔️");
        
        const prompt = `You are Olmo, AI2's open model. Be sturdy, reliable, and general purpose.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Olmo failed");
        }

        await react("✅");
        await reply(`🏔️ *OLMO:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Dolly
cmd({
    pattern: "dolly",
    alias: ["dbd"],
    desc: "Databricks Dolly",
    category: "ai",
    react: "🐑",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Dolly");
        
        await react("🐑");
        
        const prompt = `You are Dolly, Databricks' helpful AI. Be gentle, kind, and always helpful.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Dolly failed");
        }

        await react("✅");
        await reply(`🐑 *DOLLY:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Falcon
cmd({
    pattern: "falcon",
    alias: ["uae"],
    desc: "Falcon AI",
    category: "ai",
    react: "🦅",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Falcon");
        
        await react("🦅");
        
        const prompt = `You are Falcon, UAE's AI. Be powerful and bilingual in Arabic and English.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Falcon failed");
        }

        await react("✅");
        await reply(`🦅 *FALCON:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Vicuna
cmd({
    pattern: "vicuna",
    alias: ["vicky"],
    desc: "Vicuna AI",
    category: "ai",
    react: "🦙",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Vicuna");
        
        await react("🦙");
        
        const prompt = `You are Vicuna, chat-optimized LLaMA. Be friendly, conversational, and detailed.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Vicuna failed");
        }

        await react("✅");
        await reply(`🦙 *VICUNA:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});

// Wizard
cmd({
    pattern: "wizard",
    alias: ["wiz"],
    desc: "WizardLM",
    category: "ai",
    react: "🧙",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, react }) => {
    try {
        if (!q) return reply("Ask Wizard");
        
        await react("🧙");
        
        const prompt = `You are WizardLM, instruction expert. Excel at complex tasks and coding.
        
        User message: ${q}`;

        const apiUrl = `https://api.zenitsu.web.id/api/ai/gpt?question=${encodeURIComponent(q)}&prompt=${encodeURIComponent(prompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.results) {
            await react("❌");
            return reply("Wizard failed");
        }

        await react("✅");
        await reply(`🧙 *WIZARD:*\n${data.results}`);
    } catch (e) {
        console.error(e);
        await react("❌");
        reply("Error");
    }
});