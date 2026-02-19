
/**
 * SERVER & TELEGRAM BOT (MongoDB Version)
 * Run with: npm run server
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Create a free MongoDB database (e.g., MongoDB Atlas).
 * 2. Set Environment Variables in your cloud provider:
 *    - BOT_TOKEN
 *    - ADMIN_CHAT_ID
 *    - MONGO_URI (or myDatabase)
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// --- CONFIGURATION ---
const TOKEN = process.env.BOT_TOKEN || "8299961218:AAEJu0bson3dxS0QwLa6LFWNfmBHRdVOxok"; 
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "8200508213";
const PORT = process.env.PORT || 3001;

// Support both standard MONGO_URI and the 'myDatabase' variable
const MONGO_URI = process.env.MONGO_URI || process.env.myDatabase || ""; 

// --- DATABASE MODELS ---
const scheduleSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // Format: "YYYY-MM-DD"
    times: [String] // ["10:00", "12:00"]
});

const bookedSlotSchema = new mongoose.Schema({
    dateTime: { type: String, required: true, unique: true }, // Format: "YYYY-MM-DDTHH:mm"
    createdAt: { type: Date, default: Date.now }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
const BookedSlot = mongoose.model('BookedSlot', bookedSlotSchema);

// --- INITIALIZE APP ---
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Bot
const bot = new TelegramBot(TOKEN, { polling: true });

// Connect to MongoDB
if (MONGO_URI) {
    // Added dbName: 'beauty_salon' to ensure data is stored in a named database
    mongoose.connect(MONGO_URI, { dbName: 'beauty_salon' })
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
    console.warn('⚠️ MONGO_URI (or myDatabase) is missing! Persistence will fail.');
}

// Set Bot Menu
bot.setMyCommands([
    { command: '/start', description: '👋 Початок роботи' },
    { command: '/add_slots', description: '📅 Додати слоти' },
    { command: '/delete_day', description: '🗑 Видалити день' },
    { command: '/check', description: '🔍 Перевірити дату' },
    { command: '/booked', description: '📕 Зайняті слоти' }
]).then(() => console.log('✅ Bot menu set'));

console.log('🤖 Бот та Сервер запускаються...');

// --- API ENDPOINTS ---

// Health Check
app.get('/health', (req, res) => res.send('OK'));

// GET /api/slots?date=YYYY-MM-DD
app.get('/api/slots', async (req, res) => {
    const { date } = req.query;
    console.log(`📥 API Request: Get slots for ${date}`); // Log for debugging

    if (!date) return res.status(400).json({ error: 'Date required' });

    try {
        // Fetch schedule for the date
        const scheduleDoc = await Schedule.findOne({ date });
        const availableTimes = scheduleDoc ? scheduleDoc.times : [];

        // Fetch booked slots for the date (starts with date string)
        const bookedDocs = await BookedSlot.find({ dateTime: { $regex: `^${date}` } });
        const bookedTimeStrings = bookedDocs.map(doc => doc.dateTime);

        const slots = availableTimes.map(time => ({
            time,
            isBooked: bookedTimeStrings.includes(`${date}T${time}`)
        }));

        console.log(`📤 API Response for ${date}: Found ${slots.length} slots`);
        res.json(slots);
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
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
        "Система працює на хмарній базі даних (MongoDB).\n\n" +
        "<b>Команди:</b>\n" +
        "/add_slots YYYY-MM-DD 10:00,12:00\n" +
        "<i>(Приклад: /add_slots 2025-05-20 10:00,14:00)</i>\n\n" +
        "/delete_day YYYY-MM-DD\n" +
        "<i>(Видалити всі слоти на конкретну дату)</i>\n\n" +
        "/check YYYY-MM-DD\n" +
        "/booked", 
        { parse_mode: 'HTML' }
    );
});

// Command: /add_slots 2025-02-20 10:00,12:00
bot.onText(/\/add_slots (.+)/, async (msg, match) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;

    const input = match[1]; 
    const [date, timesStr] = input.split(' ');

    // Validate Date Format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        bot.sendMessage(msg.chat.id, "⚠️ <b>Помилка формату дати!</b>\nПотрібно: РРРР-ММ-ДД (наприклад 2025-05-20).\nСайт не побачить дату в іншому форматі.", { parse_mode: 'HTML' });
        return;
    }
    
    if (!date || !timesStr) {
        bot.sendMessage(msg.chat.id, "⚠️ Формат: /add_slots YYYY-MM-DD HH:mm,HH:mm");
        return;
    }

    const times = timesStr.split(',');

    try {
        await Schedule.findOneAndUpdate(
            { date },
            { times },
            { upsert: true, new: true }
        );
        bot.sendMessage(msg.chat.id, `✅ <b>Слоти збережено для ${date}:</b>\n${times.join('\n')}\n\nТепер вони мають з'явитися на сайті.`, { parse_mode: 'HTML' });
    } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, "❌ Помилка збереження в базу даних.");
    }
});

// Command: /delete_day YYYY-MM-DD
bot.onText(/\/delete_day (.+)/, async (msg, match) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;

    const date = match[1].trim();

    // Validate Date Format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        bot.sendMessage(msg.chat.id, "⚠️ Використовуйте формат: /delete_day YYYY-MM-DD");
        return;
    }

    try {
        const result = await Schedule.findOneAndDelete({ date });
        
        if (result) {
            bot.sendMessage(msg.chat.id, `🗑 <b>Успішно!</b>\nВсі слоти на <b>${date}</b> видалено. Клієнти більше не побачать цей день доступним.`, { parse_mode: 'HTML' });
        } else {
            bot.sendMessage(msg.chat.id, `🤔 На дату <b>${date}</b> слотів не знайдено.`, { parse_mode: 'HTML' });
        }
    } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, "❌ Помилка при видаленні.");
    }
});

// Command: /check YYYY-MM-DD
bot.onText(/\/check (.+)/, async (msg, match) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
    
    const date = match[1].trim();

    try {
        const scheduleDoc = await Schedule.findOne({ date });
        if (!scheduleDoc) {
            bot.sendMessage(msg.chat.id, `📅 На ${date} слотів не знайдено.`);
            return;
        }

        // Get bookings to mark status
        const bookedDocs = await BookedSlot.find({ dateTime: { $regex: `^${date}` } });
        const bookedSet = new Set(bookedDocs.map(d => d.dateTime));

        const statusList = scheduleDoc.times.map(t => {
            const isBooked = bookedSet.has(`${date}T${t}`);
            return `${t} ${isBooked ? '🔴 (Зайнято)' : '🟢 (Вільно)'}`;
        }).join('\n');
        
        bot.sendMessage(msg.chat.id, `📅 <b>Розклад на ${date}:</b>\n\n${statusList}`, { parse_mode: 'HTML' });

    } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, "❌ Помилка читання бази даних.");
    }
});

// Command: /booked
bot.onText(/\/booked/, async (msg) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;

    try {
        const bookings = await BookedSlot.find({}).sort({ dateTime: 1 });
        
        if (bookings.length === 0) {
            bot.sendMessage(msg.chat.id, "📭 Немає активних бронювань.");
            return;
        }

        const list = bookings.map(b => b.dateTime.replace('T', ' ')).join('\n');
        bot.sendMessage(msg.chat.id, `📕 <b>Всі зайняті слоти:</b>\n\n${list}`, { parse_mode: 'HTML' });

    } catch (error) {
        console.error(error);
        bot.sendMessage(msg.chat.id, "❌ Помилка бази даних.");
    }
});

// Handle Buttons (Approve / Decline)
bot.on('callback_query', async (query) => {
    const action = query.data;
    const msg = query.message;
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    if (String(chatId) !== ADMIN_CHAT_ID) return;

    if (action.startsWith('approve_')) {
        const parts = action.split('_');
        const date = parts[1];
        const time = parts[2];
        const dateTime = `${date}T${time}`;

        try {
            // Save to MongoDB if not exists
            const exists = await BookedSlot.findOne({ dateTime });
            if (!exists) {
                await BookedSlot.create({ dateTime });
            }

            await bot.editMessageText(`${msg.text}\n\n✅ <b>ЗАПИС ПІДТВЕРДЖЕНО</b>\nКлієнта записано на ${time}.`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML'
            });
            await bot.answerCallbackQuery(query.id, { text: "Запис збережено в базі" });

        } catch (error) {
            console.error("DB Error on approve:", error);
            await bot.answerCallbackQuery(query.id, { text: "Помилка бази даних!" });
        }

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
