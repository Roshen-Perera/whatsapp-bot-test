import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import express from 'express';
import QRCode from 'qrcode';

// ------------------------ EXPRESS SERVER ------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Temporary QR URL (updated on 'qr' event)
let qrDataUrl: string | null = null;

app.get('/qr', (_req: any, res: { send: (arg0: string) => any; writeHead: (arg0: number, arg1: { 'Content-Type': string; 'Content-Length': number; }) => void; end: (arg0: Buffer<ArrayBuffer>) => void; }) => {
    if (!qrDataUrl) return res.send('QR not generated yet.');
    const img = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
    });
    res.end(img);
});

app.listen(PORT, () => console.log(`🚀 Express running on port ${PORT}`));

// ------------------------ BOT LOGIC ------------------------
interface UserData {
    name: string | null;
    visits: number;
    lastMessage: Date;
}

interface BotResponse {
    text: string;
    shouldReply: boolean;
}

const userData: Map<string, UserData> = new Map();

// Puppeteer flags for cloud deployment
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'jayabima' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// QR event
client.on('qr', async (qr: string) => {
    console.log('📱 QR generated! Visit /qr to scan it.');
    qrDataUrl = await QRCode.toDataURL(qr);
});

// Ready
client.on('ready', () => console.log('✅ Jayabima Hardware Bot is ready!'));

// Incoming messages
client.on('message', async (message: Message) => {
    try {
        const userId = message.from;
        if (shouldSkipMessage(userId)) return;

        const botResponse = await processMessage(message, userId);
        if (botResponse.shouldReply && botResponse.text) {
            await message.reply(botResponse.text);
        }
    } catch (err) {
        console.error('❌ Error processing message:', err);
        await message.reply('Sorry, something went wrong. Please try again.');
    }
});

// Skip groups and status
function shouldSkipMessage(userId: string): boolean {
    return userId.includes('@g.us') || userId === 'status@broadcast';
}

// Get or init user
function getUserData(userId: string): UserData {
    if (!userData.has(userId)) {
        userData.set(userId, { name: null, visits: 0, lastMessage: new Date() });
    }
    const user = userData.get(userId)!;
    user.visits++;
    user.lastMessage = new Date();
    return user;
}

// Process message
async function processMessage(message: Message, userId: string): Promise<BotResponse> {
    const user = getUserData(userId);
    const userMessage = message.body.toLowerCase().trim();

    if (user.visits === 1) {
        return {
            text: '🏪 Welcome to **Jayabima Hardware**!\n\nMay I know your name?',
            shouldReply: true
        };
    }

    if (!user.name && !isCommand(userMessage)) {
        user.name = message.body.trim();
        return {
            text: `Nice to meet you, ${user.name}! 😊\nType "products" to see categories or "help" for commands.`,
            shouldReply: true
        };
    }

    return handleUserMessage(userMessage, user);
}

// Check commands
function isCommand(message: string): boolean {
    const commands = ['products', 'help', 'hours', 'location', 'order', 'contact', 'hello', 'hi'];
    return commands.some(cmd => message.includes(cmd));
}

// Handle user messages
function handleUserMessage(msg: string, user: UserData): BotResponse {
    const name = user.name || 'customer';

    if (['hello', 'hi', 'hey'].some(g => msg.includes(g))) {
        return { text: `Hello ${name}! 👋 Welcome back to **Jayabima Hardware**.\nType "help" to see options.`, shouldReply: true };
    }

    if (msg.includes('products') || msg.includes('items') || msg.includes('materials')) {
        return { text: getProductsResponse(), shouldReply: true };
    }

    if (msg.includes('cement')) return { text: getCementMenu(), shouldReply: true };
    if (msg.includes('paint')) return { text: getPaintMenu(), shouldReply: true };
    if (msg.includes('tools')) return { text: getToolsMenu(), shouldReply: true };
    if (msg.includes('plumbing')) return { text: getPlumbingMenu(), shouldReply: true };
    if (msg.includes('hours') || msg.includes('open')) return { text: getHoursResponse(), shouldReply: true };
    if (msg.includes('location') || msg.includes('address')) return { text: getLocationResponse(), shouldReply: true };
    if (msg.includes('order')) return { text: getOrderResponse(), shouldReply: true };
    if (msg.includes('contact') || msg.includes('phone')) return { text: getContactResponse(), shouldReply: true };
    if (msg.includes('offer') || msg.includes('discount')) return { text: getOffersResponse(), shouldReply: true };
    if (msg === 'help' || msg === '?') return { text: getHelpResponse(), shouldReply: true };

    return { text: getDefaultResponse(), shouldReply: true };
}

// ------------------------ RESPONSES ------------------------
function getProductsResponse() {
    return `🛠️ **PRODUCT CATEGORIES**  
🧱 Cement & Building Materials (Type "cement")  
🎨 Paints & Finishing (Type "paint")  
🔧 Tools & Hardware (Type "tools")  
🚰 Plumbing & Fittings (Type "plumbing")`;
}

function getCementMenu() {
    return `🧱 **CEMENT & BUILDING MATERIALS**  
- Tokyo Super Cement (50kg) - Rs. 2,200  
- Holcim Cement (50kg) - Rs. 2,150  
- INSEE Cement (50kg) - Rs. 2,180`;
}

function getPaintMenu() {
    return `🎨 **PAINTS & FINISHING**  
- Nippon Weatherbond  
- JAT Woodcare & Varnish  
- Dulux Emulsion Paints`;
}

function getToolsMenu() {
    return `🔧 **TOOLS & HARDWARE**  
- Hammers, Screwdrivers, Spanners  
- Drills, Grinders, Ladders`;
}

function getPlumbingMenu() {
    return `🚰 **PLUMBING & FITTINGS**  
- PVC Pipes & Fittings  
- Water Tanks (500L - 5000L)  
- Faucets, Showers, Mixers`;
}

function getHoursResponse() {
    return `⏰ **OPENING HOURS**  
Mon-Sat: 8:00 AM - 6:00 PM  
Sun: 8:00 AM - 1:00 PM`;
}

function getLocationResponse() {
    return `📍 **JAYABIMA HARDWARE**  
123 Main Street, Kurunegala, Sri Lanka`;
}

function getOrderResponse() {
    return `🛒 **HOW TO ORDER**  
1️⃣ Send item name & quantity  
2️⃣ Call: 037-1234567  
3️⃣ Visit store`;
}

function getContactResponse() {
    return `📞 **CONTACT DETAILS**  
Phone: 037-1234567  
Email: jayabimahardware@gmail.com`;
}

function getOffersResponse() {
    return `🎉 **OFFERS**  
- Buy 5 bags of cement → FREE delivery  
- 10% OFF on paints above Rs. 10,000`;
}

function getHelpResponse() {
    return `🤖 **COMMANDS**  
- "products" → Categories  
- "cement" / "paint" / "tools" / "plumbing" → Details  
- "hours" → Opening times  
- "location" → Store address  
- "order" → How to order  
- "contact" → Phone & email  
- "offers" → Current deals`;
}

function getDefaultResponse() {
    return `🤔 Sorry, I didn’t understand.  
Try "products", "offers" or "help".`;
}

// ------------------------ ERROR HANDLERS ------------------------
client.on('auth_failure', () => console.error('❌ Authentication failed'));
client.on('disconnected', reason => console.log('📱 Disconnected:', reason));
client.on('error', error => console.error('❌ Client error:', error));

// ------------------------ START BOT ------------------------
console.log('🚀 Starting Jayabima Hardware WhatsApp Bot...');
client.initialize();
