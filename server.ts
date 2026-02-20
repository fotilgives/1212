
import express from 'express';
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
    bot.onText(/\/start/, (msg) => {
        if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
        bot.sendMessage(msg.chat.id, "👋 Вітаю, Адмін!", { parse_mode: 'HTML' });
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
            } catch (error) {
                console.error(error);
            }
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
        app.use(express.static('dist'));
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer();
