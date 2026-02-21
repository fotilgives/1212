
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import cors from 'cors';
import nodemailer from 'nodemailer';

// --- CONFIGURATION ---
const TOKEN = process.env.BOT_TOKEN || "8299961218:AAEanmyul1h3efDzXJZGICJYxQlKf5ERKJg";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "8200508213";
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://artemkamazur12_db_user:Svetlana2026@cluster0.ujv7pgy.mongodb.net/beauty_salon?appName=Cluster0";
const EMAIL_USER = process.env.EMAIL_USER || "svitlanamazur222@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "lvcb tlfq spmm fjaa";
const APP_URL = process.env.APP_URL || "https://svetlana-mazur.vercel.app";

// --- DATABASE MODELS ---
const scheduleSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    times: [String],
    isClosed: { type: Boolean, default: false }
});

const bookedSlotSchema = new mongoose.Schema({
    dateTime: { type: String, required: true, unique: true },
    clientName: String,
    clientPhone: String,
    clientEmail: String,
    clientTelegramId: String,
    service: String,
    createdAt: { type: Date, default: Date.now }
});

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema, 'schedules');
const BookedSlot = mongoose.models.BookedSlot || mongoose.model('BookedSlot', bookedSlotSchema, 'bookedslots');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Bot (Webhook mode for Vercel)
const bot = new TelegramBot(TOKEN);

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// Connect to MongoDB
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(MONGO_URI, { dbName: 'beauty_salon' });
};

// --- API ENDPOINTS ---

app.get('/api', (req, res) => res.json({ message: 'API is working' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', environment: 'vercel' }));

app.get('/api/slots', async (req, res) => {
    await connectDB();
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date required' });
    try {
        const scheduleDoc = await Schedule.findOne({ date: String(date).trim() });
        if (scheduleDoc?.isClosed) return res.json({ isClosed: true, slots: [] });
        const availableTimes = scheduleDoc ? scheduleDoc.times : [];
        const potentialBookings = availableTimes.map((time: string) => `${date}T${time.trim()}`);
        const bookedDocs = await BookedSlot.find({ dateTime: { $in: potentialBookings } }).select('dateTime');
        const bookedTimeSet = new Set(bookedDocs.map(doc => doc.dateTime));
        const slots = availableTimes.map((time: string) => ({
            time: String(time).trim(),
            isBooked: bookedTimeSet.has(`${date}T${String(time).trim()}`)
        }));
        res.json({ isClosed: false, slots });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/book', async (req, res) => {
    await connectDB();
    const { name, phone, email, service, date, time, telegramId } = req.body;
    if (!name || !phone || !email || !date || !time) return res.status(400).json({ error: 'Missing fields' });

    const dateTime = `${date}T${time}`;
    try {
        await BookedSlot.findOneAndUpdate(
            { dateTime }, 
            { clientName: name, clientPhone: phone, clientEmail: email, clientTelegramId: telegramId, service: service }, 
            { upsert: true }
        );

        const [year, month, day] = date.split('-');
        const formattedDate = `${day}.${month}.${year}`;

        // Email to Client
        if (email) {
            await transporter.sendMail({
                from: `"Svetlana Mazur" <${EMAIL_USER}>`,
                to: email,
                subject: 'Підтвердження запису | Svetlana Mazur',
                html: `<div style="font-family: sans-serif;"><h2>Запис підтверджено!</h2><p>Чекаємо на вас ${formattedDate} о ${time}.</p></div>`
            });
        }

        // Notify Admin
        if (ADMIN_CHAT_ID) {
            await bot.sendMessage(ADMIN_CHAT_ID, `✅ <b>Новий запис!</b>\n\n👤 ${name}\n📞 ${phone}\n✂️ ${service}\n📅 ${formattedDate}\n⏰ ${time}`, { parse_mode: 'HTML' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Booking failed' });
    }
});

// --- TELEGRAM WEBHOOK ENDPOINT ---
app.post('/api/webhook', async (req, res) => {
    await connectDB();
    const { message, callback_query } = req.body;

    if (message) {
        const chatId = message.chat.id;
        const text = message.text;

        if (String(chatId) === ADMIN_CHAT_ID) {
            if (text?.startsWith('/add_slots')) {
                const parts = text.split(/\s+/);
                const date = parts[1];
                const timesStr = parts[2];
                if (date && timesStr) {
                    const times = timesStr.split(',').map((t: string) => t.trim());
                    await Schedule.findOneAndUpdate({ date }, { times, isClosed: false }, { upsert: true });
                    await bot.sendMessage(chatId, `✅ Слоти додано на ${date}`);
                }
            } else if (text?.startsWith('/booked')) {
                const bookings = await BookedSlot.find({}).sort({ dateTime: 1 });
                const list = bookings.map((b: any) => b.dateTime.replace('T', ' ')).join('\n') || "Нічого не знайдено";
                await bot.sendMessage(chatId, `📕 Зайняті слоти:\n\n${list}`);
            } else if (text === '/start') {
                await bot.sendMessage(chatId, "👋 Вітаю, Адмін! Команди:\n/add_slots ГГГГ-ММ-ДД час,час\n/booked\n/check ГГГГ-ММ-ДД");
            }
        } else if (text === '/start') {
            await bot.sendMessage(chatId, "👋 Вітаємо! Записуйтесь онлайн: " + APP_URL);
        }
    }

    if (callback_query) {
        const action = callback_query.data;
        if (action?.startsWith('cancel_')) {
            const dateTime = action.replace('cancel_', '').replace('_', 'T');
            await BookedSlot.findOneAndDelete({ dateTime });
            await bot.answerCallbackQuery(callback_query.id, { text: "Запис скасовано" });
            await bot.sendMessage(callback_query.message.chat.id, "❌ Запис видалено");
        }
    }

    res.sendStatus(200);
});

// Setup Webhook helper
app.get('/api/setup-bot', async (req, res) => {
    try {
        const url = `${APP_URL}/api/webhook`;
        await bot.setWebHook(url);
        res.json({ success: true, message: `Webhook set to ${url}` });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default app;
