const { cmd } = require('../command');
const converter = require('../lib/converter');
const { lidToPhone } = require("../lib/fixlid");

// Fixed delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== OUCH COMMAND ====================
cmd({
    pattern: "ouch",
    alias: ["awch", "goiz", "sparrow"],
    desc: "Funny Pakistani meme sound - Ouch awch goiz",
    category: "fun",
    react: "😂",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const audioUrl = "https://files.catbox.moe/ije8ef.mp3";
        
        // Show recording animation
        await conn.sendPresenceUpdate('recording', from);
        
        // Fetch audio
        const audioResponse = await fetch(audioUrl);
        const arrayBuffer = await audioResponse.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        // Fixed 3-second delay before converting
        await delay(3000);

        // Convert to PTT
        const pttAudio = await converter.toPTT(audioBuffer, 'mp3');

        // Send voice note
        await conn.sendMessage(from, {
            audio: pttAudio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

    } catch (error) {
        console.error(error);
        reply(`❌ Error: ${error.message}`);
    }
});

// ==================== TECHNOLOGIA COMMAND ====================

cmd({
    pattern: "technologia",
    alias: ["tech", "technologyia"],
    desc: "Send the Technologia meme audio",
    category: "fun",
    react: "😂",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, {
            audio: { url: "https://files.catbox.moe/fac856.mp3" },
            mimetype: "audio/mpeg",
            ptt: false
        }, { quoted: mek });
    } catch (e) {
        console.error(e);
        reply("*❌ Technologia Failed!*\n_Blyat! Error: " + e.message + "_");
    }
});


// ==================== TAROUN COMMAND ====================
cmd({
    pattern: "taroun",
    alias: ["tadao", "tung"],
    desc: "Send the Taroun meme audio",
    category: "fun",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const audioUrl = "https://files.catbox.moe/tkawe4.mp3";
        
        // Show recording animation
        await conn.sendPresenceUpdate('recording', from);
        
        // Fetch audio
        const audioResponse = await fetch(audioUrl);
        const arrayBuffer = await audioResponse.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        // Fixed 3-second delay before converting
        await delay(3000);

        // Convert to PTT
        const pttAudio = await converter.toPTT(audioBuffer, 'mp3');

        // Send voice note
        await conn.sendMessage(from, {
            audio: pttAudio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply(`*❌ Taroun Failed!*\n_Error: ${e.message}_`);
    }
});

cmd({
    pattern: "cake",
    desc: "Roast Cake (Qamar) with cake-themed insults",
    category: "fun",
    react: "🎂",
    filename: __filename,
    use: "@tag"
}, async (conn, mek, m, { reply }) => {
    const cakeRoasts = [
        "Abe Cake, tu toh wahi hai jo oven mein 2 ghante mein bhi rise nahi hota!",
        "Bhai Cake, teri personality expired sponge cake jaisi hai - dry aur tasteless!",
        "Abe Cake, tera dimaag frosting ki tarah hai - zyada meetha par koi depth nahi!",
        "Tu toh wahi burnt cupcake hai jo koi kharidne nahi aata!",
        "Abe Cake, teri soch cake mix jaisi hai - just add water aur kuch bhi nahi!",
        "Bhai tu toh stale cake hai, fridge mein 1 mahine se pada hua!",
        "Abe Cake, teri zindagi eggless cake jaisi hai - missing the main ingredient!",
        "Tu toh wahi dry fruit cake hai jo sab avoid karte hain!",
        "Abe Cake, tera IQ cake tin se bhi chhota hai!",
        "Bhai tu toh melted ice cream cake hai, shapeless aur messy!",
        "Abe Cake, teri baatein fondant jaisi hain - dikhti achi hain par taste kharab!",
        "Tu toh wahi cake hai jismein candle jalaane se pehle hi bujh jaati hai!",
        "Abe Cake, tera style layered cake jaisa hai - zyada layers, zero substance!",
        "Bhai tu toh microwave cake hai - jaldi bana par koi nahi khata!",
        "Abe Cake, teri soch cake batter jaisi hai - ghulti nahi aur lumpy hai!",
        "Tu toh wahi wedding cake hai jo display ke baad kachre mein jaata hai!",
        "Abe Cake, tera dimaag cake server jaisa hai - bas pieces kaat ta hai!",
        "Bhai tu toh gluten-free cake hai - sab avoid karte hain samajh ke!",
        "Abe Cake, teri personality fruit cake jaisi hai - koi nahi chunta voluntarily!",
        "Tu toh wahi cake hai jo delivery mein damage ho gaya ho!",
        "Abe Cake, tera zindagi ka recipe hi galat hai!",
        "Bhai tu toh cake pop hai - chhota aur insignificant!",
        "Abe Cake, teri baatein cake crumbs jaisi hain - har jagah bikhri hain!",
        "Tu toh wahi cake hai jismein salt sugar ki jagah daal diya ho!",
        "Abe Cake, tera style cheesecake jaisa hai - thoda sa bhi zyada ho toh kharab!",
        "Bhai tu toh store-bought cake hai - generic aur forgettable!",
        "Abe Cake, teri soch cake decorating jaisi hai - bas upar se sahi!",
        "Tu toh wahi cake hai jo 'happy birthday' ke bina adhura lagta hai!",
        "Abe Cake, tera dimaag cake box jaisa hai - khali aur cardboard!",
        "Bhai tu toh lava cake hai - andar se bhi khaali hai!",
        "Abe Cake, teri zindagi cake walk nahi, cake fall hai!",
        "Tu toh wahi red velvet cake hai jo actually brown hai - fake!",
        "Abe Cake, tera personality cake slice jaisa hai - sabko chhota hissa chahiye!",
        "Bhai tu toh birthday cake hai - saal mein ek baar yaad aata hai!",
        "Abe Cake, teri baatein cake tester jaisi hain - chhote aur annoying!",
        "Tu toh wahi cake hai jo oven se nikaalne se pehle hi khaaya gaya - incomplete!",
        "Abe Cake, tera style bundt cake jaisa hai - weird shape, weird taste!",
        "Bhai tu toh cake boss banna chahata tha, par cake disaster ban gaya!",
        "Abe Cake, teri soch cake recipe jaisi hai - complicated aur end mein fail!",
        "Tu toh wahi cake hai jismein baking soda zyada daal diya ho - fluffy but bitter!",
        "Abe Cake, tera dimaag cake dome jaisa hai - upar se bada, andar se khaali!",
        "Bhai tu toh cake mix box hai - instructions follow karne ke bawajood kharab!",
        "Abe Cake, teri zindagi cake frosting bag jaisi hai - pressure mein burst ho jaati hai!",
        "Tu toh wahi angel food cake hai - light aur air, matlab kuch bhi nahi!",
        "Abe Cake, tera personality upside-down cake jaisa hai - sab ulta hai!",
        "Bhai tu toh cake tester hai - sabki life mein bas taste test karta hai!",
        "Abe Cake, teri baatein cake crumbs vacuum mein jaisi hain - disappear ho jaati hain!",
        "Tu toh wahi cake hai jo 'best before' date cross kar chuka hai!",
        "Abe Cake, tera style cake pop stand jaisa hai - sab gira deta hai!",
        "Bhai tu toh pound cake hai - heavy aur hard to digest!",
        "Abe Cake, teri soch cake leveler jaisi hai - sabko neeche laata hai!",
        "Tu toh wahi ice cream cake hai - do cheezon mein se bekaar wala hissa!"
    ];

    const randomRoast = cakeRoasts[Math.floor(Math.random() * cakeRoasts.length)];
    
    // Get mentioned user from tag or reply
    let mentionedUser = m.mentionedJid?.[0] || (mek.quoted?.sender ?? null);

    // Cake's identifiers - update these with actual values
    const cakeLid = "275432444264532@lid";
    const cakeNumber = "923287930977";

    // Check if it's actually Cake
    let isCake = false;
    let targetLid = null;
    let targetPN = null;

    if (mentionedUser) {
        // Convert LID to phone number if needed
        if (mentionedUser.includes('@lid')) {
            targetPN = await lidToPhone(conn, mentionedUser);
            targetLid = mentionedUser;
        } else {
            targetPN = mentionedUser.split('@')[0];
            // Try to get LID from phone (if available in your fixlid lib)
            targetLid = mentionedUser;
        }
        
        // Check if it matches Cake's LID or number
        if (mentionedUser === cakeLid || 
            targetPN === cakeNumber ||
            mentionedUser.includes(cakeNumber)) {
            isCake = true;
        }
    }

    // If not Cake, send funny rejection
    if (!isCake) {
        return reply("🎂 Ohh man, he is not Cake!\n\nPlease mention Cake (Qamar) to roast him!\n\n*Usage:* `.cake @Cake` or reply to Cake's message");
    }

    // It's Cake! Get proper LID for mention
    const finalLid = cakeLid;
    const userName = cakeNumber; // or use targetPN if you want dynamic
    
    // Send the roast with proper LID mention
    const message = `🎂 *CAKE ALERT* 🎂\n\n@${userName} !\n*${randomRoast}*\n> Don't crumble, it's just for fun! 😄`;

    await conn.sendMessage(mek.chat, { 
        text: message,
        mentions: [finalLid],
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            mentionedJid: [finalLid]
        }
    }, { quoted: mek });
});
        
