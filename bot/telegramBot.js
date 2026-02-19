
/**
 * SERVER & TELEGRAM BOT
 * Run with: npm run server (or 'node bot/telegramBot.js')
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Set Environment Variables: BOT_TOKEN, ADMIN_CHAT_ID
 * 2. If using Render/Railway, set DATA_DIR to a mounted volume path to persist db.json
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// Use environment variables for sensitive data, fallback to strings for local dev
const TOKEN = process.env.BOT_TOKEN || "8299961218:AAGLitau59BpwqlNA3IfiXjQK0wRw0xf4qk"; 
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "8200508213";
const PORT = process.env.PORT || 3001;

// Persistence: Use DATA_DIR env var if available (for Docker volumes), else current dir
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_FILE = path.join(DATA_DIR, 'db.json');

// --- INITIALIZE APP ---
const app = express();
app.use(cors()); // Allow all origins for simplicity in this setup
app.use(express.json());

// Initialize Bot
const bot = new TelegramBot(TOKEN, { polling: true });

// Set Bot Menu Commands (UI/UX)
bot.setMyCommands([
    { command: '/start', description: '👋 Початок роботи' },
    { command: '/add_slots', description: '📅 Додати слоти (РРРР-ММ-ДД)' },
    { command: '/check', description: '🔍 Перевірити дату' },
    { command: '/booked', description: '📕 Зайняті слоти' }
]).then(() => {
    console.log('✅ Bot menu commands set');
});

// --- DATABASE HELPERS ---
function readDB() {
    // Ensure directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
        // Default structure
        const defaultDB = {
            schedule: {}, // "2025-02-20": ["10:00", "12:00"]
            booked: []    // "2025-02-20T10:00"
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2));
        return defaultDB;
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading DB:", error);
        return { schedule: {}, booked: [] };
    }
}

function writeDB(data) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing DB:", error);
    }
}

console.log('🤖 Бот та Сервер запускаються...');

// --- API ENDPOINTS ---

// Health Check (for keep-alive services)
app.get('/health', (req, res) => {
    res.send('OK');
});

// GET /api/slots?date=YYYY-MM-DD
app.get('/api/slots', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date required' });

    const db = readDB();
    const availableTimes = db.schedule[date] || []; 
    
    // Map to object indicating if booked
    const slots = availableTimes.map(time => {
        const dateTime = `${date}T${time}`;
        return {
            time,
            isBooked: db.booked.includes(dateTime)
        };
    });

    res.json(slots);
});

// POST /api/book
app.post('/api/book', async (req, res) => {
    const { name, phone, service, date, time } = req.body;

    if (!name || !phone || !date || !time) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const message = `
🌟 <b>Новий запит з сайту!</b>

👤 <b>Клієнт:</b> ${name}
📞 <b>Телефон:</b> ${phone}
✂️ <b>Послуга:</b> ${service}
📅 <b>Дата:</b> ${date}
⏰ <b>Час:</b> ${time}

<i>Очікує підтвердження...</i>
    `.trim();

    try {
        await bot.sendMessage(ADMIN_CHAT_ID, message, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Погодитись", callback_data: `approve_${date}_${time}` },
                        { text: "❌ Відхилити", callback_data: `decline_${date}_${time}` }
                    ]
                ]
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Telegram Error:", error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});


// --- TELEGRAM BOT LOGIC ---

// Command: /start
bot.onText(/\/start/, (msg) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
    bot.sendMessage(msg.chat.id, 
        "👋 <b>Вітаю, Адмін!</b>\n\n" +
        "Використовуйте <b>Меню</b> зліва знизу для керування.\n\n" +
        "<b>Команди вручну:</b>\n" +
        "/add_slots YYYY-MM-DD 10:00,12:00\n" +
        "/check YYYY-MM-DD\n" +
        "/booked", 
        { parse_mode: 'HTML' }
    );
});

// Command: /add_slots 2025-02-20 10:00,12:00
bot.onText(/\/add_slots (.+)/, (msg, match) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;

    const input = match[1]; // "2025-02-20 10:00,12:00"
    const [date, timesStr] = input.split(' ');
    
    if (!date || !timesStr) {
        bot.sendMessage(msg.chat.id, "⚠️ Формат: /add_slots YYYY-MM-DD HH:mm,HH:mm");
        return;
    }

    const times = timesStr.split(',');
    
    // Update DB
    const db = readDB();
    db.schedule[date] = times;
    writeDB(db);

    bot.sendMessage(msg.chat.id, `✅ <b>Слоти додано на ${date}:</b>\n${times.join('\n')}`, { parse_mode: 'HTML' });
});

// Command: /check YYYY-MM-DD
bot.onText(/\/check (.+)/, (msg, match) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
    
    const date = match[1];
    const db = readDB();
    const slots = db.schedule[date];

    if (!slots) {
        bot.sendMessage(msg.chat.id, `📅 На ${date} слотів не знайдено.`);
    } else {
        const statusList = slots.map(t => {
            const isBooked = db.booked.includes(`${date}T${t}`);
            return `${t} ${isBooked ? '🔴 (Зайнято)' : '🟢 (Вільно)'}`;
        }).join('\n');
        
        bot.sendMessage(msg.chat.id, `📅 <b>Розклад на ${date}:</b>\n\n${statusList}`, { parse_mode: 'HTML' });
    }
});

// Command: /booked
bot.onText(/\/booked/, (msg) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
    const db = readDB();
    
    if (db.booked.length === 0) {
        bot.sendMessage(msg.chat.id, "📭 Немає активних бронювань.");
        return;
    }

    const list = db.booked.map(s => s.replace('T', ' ')).join('\n');
    bot.sendMessage(msg.chat.id, `📕 <b>Зайняті слоти (Закреслені на сайті):</b>\n\n${list}`, { parse_mode: 'HTML' });
});

// Handle Buttons (Approve / Decline)
bot.on('callback_query', async (query) => {
    const action = query.data;
    const msg = query.message;
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    if (String(chatId) !== ADMIN_CHAT_ID) return;

    if (action.startsWith('approve_')) {
        // approve_2025-02-20_10:00
        const parts = action.split('_');
        const date = parts[1];
        const time = parts[2];
        const dateTime = `${date}T${time}`;

        // Save to DB
        const db = readDB();
        if (!db.booked.includes(dateTime)) {
            db.booked.push(dateTime);
            writeDB(db);
        }

        // Update Telegram Message
        await bot.editMessageText(`${msg.text}\n\n✅ <b>ЗАПИС ПІДТВЕРДЖЕНО</b>\nКлієнта записано на ${time}.`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML'
        });
        await bot.answerCallbackQuery(query.id, { text: "Запис підтверджено" });

    } else if (action.startsWith('decline_')) {
        
        await bot.editMessageText(`${msg.text}\n\n❌ <b>ЗАПИС ВІДХИЛЕНО</b>`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML'
        });
        await bot.answerCallbackQuery(query.id, { text: "Запис відхилено" });
    }
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
