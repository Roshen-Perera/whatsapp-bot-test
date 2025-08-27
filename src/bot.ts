import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { config } from './config';
import {
    ProductCategory, ProductItem, Order, OrderItem, OrderStatus
} from './types';
import { categoryLabels, formatProductList } from './lib/format';
import { listByCategory, searchProducts, findById, calcTotal } from './lib/logic';

// ===== simple in-memory stores =====
interface UserData {
    name: string | null;
    visits: number;
    lastMessage: Date;
}
const users = new Map<string, UserData>();
const carts = new Map<string, OrderItem[]>();   // userId -> items
const orders = new Map<string, Order[]>();      // userId -> order history

// ===== whatsapp client =====
const client = new Client({ authStrategy: new LocalAuth() });

client.on('qr', (qr: string) => {
    console.log('📱 Scan this QR code with your WhatsApp app:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Jayabima Hardware Bot is ready!');
});

client.on('auth_failure', () => console.error('❌ Authentication failed'));
client.on('disconnected', (reason: string) => console.log('📱 Disconnected:', reason));
client.on('error', (error: Error) => console.error('❌ Client error:', error));

// ===== helpers =====
function shouldSkipMessage(userId: string): boolean {
    return userId.includes('@g.us') || userId === 'status@broadcast';
}

function getUser(userId: string): UserData {
    if (!users.has(userId)) {
        users.set(userId, { name: null, visits: 0, lastMessage: new Date() });
    }
    const u = users.get(userId)!;
    u.visits++;
    u.lastMessage = new Date();
    return u;
}

function ensureCart(userId: string): OrderItem[] {
    if (!carts.has(userId)) carts.set(userId, []);
    return carts.get(userId)!;
}

function newOrderId() {
    return `ORD-${Date.now()}`;
}

// ===== message routing =====
client.on('message', async (message: Message) => {
    const userId = message.from;
    if (shouldSkipMessage(userId)) return;

    const text = (message.body || '').trim();
    const lower = text.toLowerCase();

    const user = getUser(userId);

    // first-time welcome
    if (user.visits === 1) {
        await message.reply(
            `🏪 Welcome to *${config.store.name}*!\n` +
            `May I know your name? (This helps me serve you better)`
        );
        return;
    }

    // if no name yet and not a command, treat as name
    if (!user.name && !/^(help|products|cement|paint|tools|plumbing|electrical|offers|hours|location|contact|check|add|cart|clear|confirm)\b/i.test(lower)) {
        user.name = text;
        await message.reply(
            `Nice to meet you, ${user.name}! 😊\n` +
            `Type *products* to see categories or *help* for all commands.`
        );
        return;
    }

    // commands
    if (/^help$/i.test(lower)) return void message.reply(helpText());
    if (/^(hi|hello|hey)$/i.test(lower)) return void message.reply(greet(user.name));

    if (/^products$/i.test(lower)) {
        const list =
            `🛠️ *PRODUCT CATEGORIES*\n\n` +
            `• ${categoryLabels.cement} — type *cement*\n` +
            `• ${categoryLabels.paint} — type *paint*\n` +
            `• ${categoryLabels.tools} — type *tools*\n` +
            `• ${categoryLabels.plumbing} — type *plumbing*\n` +
            `• ${categoryLabels.electrical} — type *electrical*`;
        return void message.reply(list);
    }

    if (/^cement$/i.test(lower)) {
        return void message.reply(formatProductList(listByCategory(ProductCategory.CEMENT), categoryLabels.cement));
    }
    if (/^paint$/i.test(lower)) {
        return void message.reply(formatProductList(listByCategory(ProductCategory.PAINT), categoryLabels.paint));
    }
    if (/^tools$/i.test(lower)) {
        return void message.reply(formatProductList(listByCategory(ProductCategory.TOOLS), categoryLabels.tools));
    }
    if (/^plumbing$/i.test(lower)) {
        return void message.reply(formatProductList(listByCategory(ProductCategory.PLUMBING), categoryLabels.plumbing));
    }
    if (/^electrical$/i.test(lower)) {
        return void message.reply(formatProductList(listByCategory(ProductCategory.ELECTRICAL), categoryLabels.electrical));
    }

    // stock/price check: "check <keyword>"
    const checkMatch = lower.match(/^check\s+(.+)/i);
    if (checkMatch) {
        const keyword = checkMatch[1];
        const results = searchProducts(keyword);
        if (!results.length) return void message.reply(`No products found for "${keyword}". Try a different keyword or type *products*.`);
        const top = results.slice(0, 6);
        const lines = top.map(p => `• ${p.name} [${p.id}] — Rs. ${p.price.toLocaleString()} (${p.available ? 'In stock' : 'Out of stock'})`);
        return void message.reply(`🔎 *Search results*\n\n${lines.join('\n')}\n\n➡️ Use: *add <ID> <qty>*`);
    }

    // add to cart: "add <id> <qty>"
    const addMatch = lower.match(/^add\s+([a-z0-9-]+)\s+(\d+)/i);
    if (addMatch) {
        const [, id, qtyStr] = addMatch;
        const qty = Math.max(1, parseInt(qtyStr, 10) || 1);
        const product = findById(id);
        if (!product) return void message.reply(`I couldn't find product with ID *${id}*. Type *check <keyword>* or *products*.`);
        if (!product.available) return void message.reply(`*${product.name}* is currently out of stock.`);
        const cart = ensureCart(userId);
        cart.push({ product, quantity: qty });
        const subtotal = product.price * qty;
        return void message.reply(`🧺 Added *${product.name}* x ${qty} — Rs. ${subtotal.toLocaleString()}\nType *cart* to view your cart or *confirm* to place order.`);
    }

    // view cart
    if (/^cart$/i.test(lower)) {
        const cart = ensureCart(userId);
        if (!cart.length) return void message.reply('Your cart is empty. Add items using *add <ID> <qty>*.');
        const lines = cart.map(it => `• ${it.product.name} x ${it.quantity} — Rs. ${(it.product.price * it.quantity).toLocaleString()}`);
        const total = calcTotal(cart);
        return void message.reply(`🧺 *Your Cart*\n\n${lines.join('\n')}\n\n*Total:* Rs. ${total.toLocaleString()}\n\nCommands: *confirm*, *clear*`);
    }

    // clear cart
    if (/^clear$/i.test(lower)) {
        carts.set(userId, []);
        return void message.reply('🧹 Cart cleared.');
    }

    // confirm order
    if (/^confirm$/i.test(lower)) {
        const cart = ensureCart(userId);
        if (!cart.length) return void message.reply('Your cart is empty. Add items first with *add <ID> <qty>*.');
        const order: Order = {
            id: newOrderId(),
            userId,
            items: cart,
            total: calcTotal(cart),
            status: OrderStatus.PENDING,
            createdAt: new Date()
        };
        // save
        carts.set(userId, []);
        if (!orders.has(userId)) orders.set(userId, []);
        orders.get(userId)!.push(order);
        return void message.reply(
            `✅ *Order placed!* ID: ${order.id}\n` +
            `Total: Rs. ${order.total.toLocaleString()}\n` +
            `We’ll contact you shortly at this number to confirm delivery/pickup.\n` +
            `📞 ${config.store.phone}`
        );
    }

    // info commands
    if (/^offers?$/i.test(lower)) {
        return void message.reply(
            `🎉 *Current Offers*\n` +
            `• Buy 5 bags of cement → FREE delivery.\n` +
            `• 10% OFF on paints above Rs. 10,000.\n` +
            `• Special discounts on Bosch tools.\n\n` +
            `*Valid until end of month.*`
        );
    }

    if (/^hours?|open$/i.test(lower)) {
        return void message.reply(
            `⏰ *Opening Hours*\n` +
            `Mon–Sat: 8:00 AM – 6:00 PM\n` +
            `Sun: 8:00 AM – 1:00 PM`
        );
    }

    if (/^location|address$/i.test(lower)) {
        return void message.reply(
            `📍 *${config.store.name}*\n${config.store.address}\n\n` +
            `🚚 Delivery available within city limits.`
        );
    }

    if (/^contact|phone$/i.test(lower)) {
        return void message.reply(
            `📞 *Contact*\nPhone: ${config.store.phone}\nEmail: ${config.store.email}`
        );
    }

    // fallback
    return void message.reply(
        `I didn't quite understand.\n\n` +
        `Try:\n• *products* — categories\n• *check cement* — search\n• *add CEM-TS-50 3* — add to cart\n• *cart* — view cart\n• *help* — all commands`
    );
});

// ===== helpers (text) =====
function greet(name: string | null): string {
    const who = name ?? 'customer';
    return `Hello ${who}! 👋 How can I help you today?\nType *products* to browse or *help* for all commands.`;
}

function helpText(): string {
    return (
        `🤖 *Commands*\n\n` +
        `• *products* — show categories\n` +
        `• *cement* / *paint* / *tools* / *plumbing* / *electrical* — list items\n` +
        `• *check <keyword>* — search products\n` +
        `• *add <ID> <qty>* — add to cart (e.g., add CEM-TS-50 3)\n` +
        `• *cart* — view your cart\n` +
        `• *confirm* — place an order\n` +
        `• *clear* — clear cart\n` +
        `• *offers* — current promotions\n` +
        `• *hours* / *location* / *contact*\n`
    );
}

// ===== start =====
console.log('🚀 Starting Jayabima Hardware WhatsApp Bot...');
client.initialize();
