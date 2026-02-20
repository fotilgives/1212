
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import cors from 'cors';

// --- CONFIGURATION ---
const TOKEN = process.env.BOT_TOKEN || "8299961218:AAEJu0bson3dxS0QwLa6LFWNfmBHRdVOxok";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "8200508213";
const MONGO_URI = process.env.MONGO_URI || process.env.myDatabase || "mongodb+srv://artemkamazur12_db_user:Svetlana2026@cluster0.ujv7pgy.mongodb.net/?appName=Cluster0";
const PORT = 3000;

// --- DATABASE MODELS ---
const scheduleSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    times: [String]
});

const bookedSlotSchema = new mongoose.Schema({
    dateTime: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now }
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
const BookedSlot = mongoose.model('BookedSlot', bookedSlotSchema);

async function startServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Initialize Bot
    const bot = new TelegramBot(TOKEN, { polling: true });

    bot.on('polling_error', (error: any) => {
        if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
            console.error('❌ Telegram Bot Conflict: Інша копія цього бота вже запущена (наприклад, на Render або локально).');
            console.error('Будь ласка, зупиніть інші інстанції бота або змініть токен.');
        } else {
            console.error('⚠️ Telegram Polling Error:', error.message);
        }
    });

    // Connect to MongoDB
    if (MONGO_URI) {
        mongoose.connect(MONGO_URI, { dbName: 'beauty_salon' })
            .then(() => console.log('✅ Connected to MongoDB'))
            .catch(err => console.error('❌ MongoDB Connection Error:', err));
    }

    // --- API ENDPOINTS ---
    app.get('/api/slots', async (req, res) => {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: 'Date required' });
        try {
            const scheduleDoc = await Schedule.findOne({ date });
            const availableTimes = scheduleDoc ? scheduleDoc.times : [];
            const bookedDocs = await BookedSlot.find({ dateTime: { $regex: `^${date}` } });
            const bookedTimeStrings = bookedDocs.map(doc => doc.dateTime);
            const slots = availableTimes.map(time => ({
                time,
                isBooked: bookedTimeStrings.includes(`${date}T${time}`)
            }));
            res.json(slots);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/api/book', async (req, res) => {
        const { name, phone, service, date, time, telegramId } = req.body;
        if (!name || !phone || !date || !time) return res.status(400).json({ error: 'Missing fields' });

        const message = `
🌟 <b>Новий запит з сайту!</b>

👤 <b>Клієнт:</b> ${name}
📞 <b>Телефон:</b> ${phone}
✂️ <b>Послуга:</b> ${service}
📅 <b>Дата:</b> ${date}
⏰ <b>Час:</b> ${time}
${telegramId ? `🆔 <b>Telegram ID:</b> <code>${telegramId}</code>` : '<i>(Telegram ID не знайдено)</i>'}

<i>Очікує підтвердження...</i>
        `.trim();

        try {
            await bot.sendMessage(ADMIN_CHAT_ID, message, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "✅ Погодитись", callback_data: `approve_${date}_${time}_${telegramId || 'none'}` },
                            { text: "❌ Відхилити", callback_data: `decline_${date}_${time}` }
                        ]
                    ]
                }
            });
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to send message' });
        }
    });

    // --- TELEGRAM BOT LOGIC ---
    bot.setMyCommands([
        { command: '/start', description: '👋 Початок роботи' },
        { command: '/add_slots', description: '📅 Додати слоти' },
        { command: '/delete_day', description: '🗑 Видалити день' },
        { command: '/check', description: '🔍 Перевірити дату' },
        { command: '/booked', description: '📕 Зайняті слоти' }
    ]).then(() => console.log('✅ Bot menu set'));

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
        const input = match ? match[1] : ''; 
        const [date, timesStr] = input.split(' ');
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            bot.sendMessage(msg.chat.id, "⚠️ <b>Помилка формату дати!</b>\nПотрібно: РРРР-ММ-ДД.", { parse_mode: 'HTML' });
            return;
        }
        if (!date || !timesStr) {
            bot.sendMessage(msg.chat.id, "⚠️ Формат: /add_slots YYYY-MM-DD HH:mm,HH:mm");
            return;
        }
        const times = timesStr.split(',');
        try {
            await Schedule.findOneAndUpdate({ date }, { times }, { upsert: true, new: true });
            bot.sendMessage(msg.chat.id, `✅ <b>Слоти збережено для ${date}:</b>\n${times.join('\n')}`, { parse_mode: 'HTML' });
        } catch (error) {
            bot.sendMessage(msg.chat.id, "❌ Помилка збереження.");
        }
    });

    // Command: /delete_day YYYY-MM-DD
    bot.onText(/\/delete_day (.+)/, async (msg, match) => {
        if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
        const date = match ? match[1].trim() : '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            bot.sendMessage(msg.chat.id, "⚠️ Формат: /delete_day YYYY-MM-DD");
            return;
        }
        try {
            const result = await Schedule.findOneAndDelete({ date });
            bot.sendMessage(msg.chat.id, result ? `🗑 <b>Успішно!</b>\nСлоти на ${date} видалено.` : `🤔 На ${date} слотів не знайдено.`, { parse_mode: 'HTML' });
        } catch (error) {
            bot.sendMessage(msg.chat.id, "❌ Помилка видалення.");
        }
    });

    // Command: /check YYYY-MM-DD
    bot.onText(/\/check (.+)/, async (msg, match) => {
        if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
        const date = match ? match[1].trim() : '';
        try {
            const scheduleDoc = await Schedule.findOne({ date });
            if (!scheduleDoc) {
                bot.sendMessage(msg.chat.id, `📅 На ${date} слотів не знайдено.`);
                return;
            }
            const bookedDocs = await BookedSlot.find({ dateTime: { $regex: `^${date}` } });
            const bookedSet = new Set(bookedDocs.map(d => d.dateTime));
            const statusList = scheduleDoc.times.map(t => {
                const isBooked = bookedSet.has(`${date}T${t}`);
                return `${t} ${isBooked ? '🔴 (Зайнято)' : '🟢 (Вільно)'}`;
            }).join('\n');
            bot.sendMessage(msg.chat.id, `📅 <b>Розклад на ${date}:</b>\n\n${statusList}`, { parse_mode: 'HTML' });
        } catch (error) {
            bot.sendMessage(msg.chat.id, "❌ Помилка читання.");
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
            bot.sendMessage(msg.chat.id, "❌ Помилка читання.");
        }
    });

    bot.on('callback_query', async (query) => {
        const action = query.data;
        const msg = query.message;
        if (!msg) return;
        const chatId = msg.chat.id;
        const messageId = msg.message_id;

        if (String(chatId) !== ADMIN_CHAT_ID) return;

        if (action?.startsWith('approve_')) {
            const parts = action.split('_');
            const date = parts[1];
            const time = parts[2];
            const clientTelegramId = parts[3];
            const dateTime = `${date}T${time}`;

            try {
                const exists = await BookedSlot.findOne({ dateTime });
                if (!exists) await BookedSlot.create({ dateTime });

                let notificationStatus = "";
                if (clientTelegramId && clientTelegramId !== 'none') {
                    try {
                        const clientMessage = `Вітаємо! Ваш запис до Svetlana Mazur підтверджено на ${date} о ${time}. Чекаємо на вас!`;
                        await bot.sendMessage(clientTelegramId, clientMessage);
                        notificationStatus = "\n🔔 <b>Сповіщення надіслано в Telegram!</b>";
                    } catch (tgErr) {
                        notificationStatus = "\n⚠️ <b>Не вдалося надіслати сповіщення.</b>";
                    }
                }

                await bot.editMessageText(`${msg.text}\n\n✅ <b>ЗАПИС ПІДТВЕРДЖЕНО</b>\nКлієнта записано на ${time}.${notificationStatus}`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'HTML'
                });
                await bot.answerCallbackQuery(query.id, { text: "Запис підтверджено" });
            } catch (error) {
                console.error(error);
                await bot.answerCallbackQuery(query.id, { text: "Помилка бази даних!" });
            }
        } else if (action?.startsWith('decline_')) {
            await bot.editMessageText(`${msg.text}\n\n❌ <b>ЗАПИС ВІДХИЛЕНО</b>`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML'
            });
            await bot.answerCallbackQuery(query.id, { text: "Запис відхилено" });
        }
    });

    // --- VITE MIDDLEWARE ---
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        app.use(express.static('dist'));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer();
