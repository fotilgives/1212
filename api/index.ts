
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import cors from 'cors';
import nodemailer from 'nodemailer';

// --- CONFIGURATION ---
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const MONGO_URI = process.env.MONGO_URI;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const APP_URL = process.env.APP_URL || "https://svetlana-mazur.vercel.app";

if (!TOKEN) {
    console.error("❌ ERROR: BOT_TOKEN is missing in environment variables!");
}

// --- HELPERS ---
const sendTelegramMessage = async (chatId: string | number, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') => {
    if (!TOKEN) {
        console.error("⚠️ Cannot send Telegram message: BOT_TOKEN is missing.");
        return;
    }
    try {
        const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode
            })
        });
        const data: any = await response.json();
        if (!data.ok) {
            console.error("❌ Telegram API Error:", data.description);
            if (data.error_code === 401) {
                console.error("⚠️ BOT_TOKEN is invalid. Please check your environment variables.");
            }
        } else {
            console.log(`✅ Telegram message sent to ${chatId}`);
        }
        return data;
    } catch (err: any) {
        console.error("❌ Network error sending to Telegram:", err.message);
    }
};

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
const bot = new TelegramBot(TOKEN || "");

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

// --- EMAIL TEMPLATE ---
const generateEmailHtml = (customerName: string, serviceName: string, date: string, time: string) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Підтвердження запису</title>
        <style>
            body { background-color: #fdfaf7; margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(197, 160, 89, 0.1); }
            .header { background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #f5eee0; }
            .logo { font-size: 24px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #333; margin: 0; }
            .content { padding: 40px 50px; text-align: center; }
            .title { font-size: 22px; color: #c5a059; font-weight: 400; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
            .greeting { font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 30px; }
            .details-box { background-color: #fdfaf7; border: 1px solid #f5eee0; border-radius: 12px; padding: 25px; margin-bottom: 35px; text-align: left; }
            .detail-item { margin-bottom: 12px; font-size: 14px; color: #444; }
            .detail-label { font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; color: #c5a059; display: block; margin-bottom: 4px; }
            .detail-value { font-size: 16px; font-weight: 300; }
            .address { font-size: 14px; color: #888; margin-top: 20px; line-height: 1.5; }
            .button { display: inline-block; padding: 16px 40px; background-color: #c5a059; color: #ffffff !important; text-decoration: none; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; transition: background-color 0.3s; }
            .footer { padding: 30px; background-color: #ffffff; text-align: center; border-top: 1px solid #f5eee0; }
            .social-link { color: #c5a059; text-decoration: none; font-size: 13px; margin: 0 15px; font-weight: 500; }
            .phone { display: block; margin-top: 15px; font-size: 14px; color: #333; text-decoration: none; }
            @media only screen and (max-width: 600px) {
                .container { margin: 0; border-radius: 0; }
                .content { padding: 30px 20px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">Svetlana Mazur Beauty</h1>
            </div>
            <div class="content">
                <h2 class="title">Ваш запис підтверджено</h2>
                <p class="greeting">Вітаємо, ${customerName}! <br> Ваша краса в надійних руках. Ми вже готуємося до вашого візиту.</p>
                
                <div class="details-box">
                    <div class="detail-item">
                        <span class="detail-label">Послуга</span>
                        <span class="detail-value">${serviceName}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Дата та час</span>
                        <span class="detail-value">${date} о ${time}</span>
                    </div>
                    <div class="detail-item" style="margin-bottom: 0;">
                        <span class="detail-label">Локація</span>
                        <span class="detail-value">м. Вінниця, вул. Князів Коріатовичів, 106</span>
                    </div>
                </div>

                <a href="https://www.google.com/maps/search/?api=1&query=Вінниця+Князів+Коріатовичів+106" class="button">Як знайти студію</a>
                
                <p class="address">Будь ласка, приходьте за 5-10 хвилин до початку. <br> Якщо ваші плани зміняться, повідомте нас заздалегідь.</p>
            </div>
            <div class="footer">
                <a href="https://www.instagram.com/svet.mazur.hair?igsh=MTY4b2RqdGs0Yzc4cQ==" class="social-link">Instagram</a>
                <a href="tel:+380979112015" class="phone">+380 97 911 2015</a>
            </div>
        </div>
    </body>
    </html>
    `;
};

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
                html: generateEmailHtml(name, service, formattedDate, time)
            });
        }

        // Notify Admin via Telegram (Direct Fetch)
        if (ADMIN_CHAT_ID) {
            const telegramMessage = `🔔 <b>НОВИЙ ЗАПИС</b>\n\n👤 <b>Клієнт:</b> ${name}\n📞 <b>Телефон:</b> ${phone}\n📅 <b>Дата/Час:</b> ${formattedDate} о ${time}\n💅 <b>Послуга:</b> ${service}`;
            sendTelegramMessage(ADMIN_CHAT_ID, telegramMessage);
        }

        // We return success even if Telegram fails, as long as the database and email worked
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
                    await sendTelegramMessage(chatId, `✅ Слоти додано на ${date}`);
                } else {
                    await sendTelegramMessage(chatId, "⚠️ Формат: /add_slots YYYY-MM-DD 10:00,12:00");
                }
            } else if (text?.startsWith('/close_day')) {
                const date = text.split(/\s+/)[1];
                if (date) {
                    await Schedule.findOneAndUpdate({ date }, { isClosed: true, times: [] }, { upsert: true });
                    await sendTelegramMessage(chatId, `🔒 День ${date} закрито для запису`);
                } else {
                    await sendTelegramMessage(chatId, "⚠️ Формат: /close_day YYYY-MM-DD");
                }
            } else if (text?.startsWith('/delete_day')) {
                const date = text.split(/\s+/)[1];
                if (date) {
                    await Schedule.findOneAndDelete({ date });
                    await BookedSlot.deleteMany({ dateTime: { $regex: `^${date}` } });
                    await sendTelegramMessage(chatId, `🗑 День ${date} та всі записи видалено`);
                } else {
                    await sendTelegramMessage(chatId, "⚠️ Формат: /delete_day YYYY-MM-DD");
                }
            } else if (text?.startsWith('/unbook')) {
                const parts = text.split(/\s+/);
                const date = parts[1];
                const time = parts[2];
                if (date && time) {
                    await BookedSlot.findOneAndDelete({ dateTime: `${date}T${time}` });
                    await sendTelegramMessage(chatId, `🔓 Слот ${date} о ${time} тепер вільний`);
                } else {
                    await sendTelegramMessage(chatId, "⚠️ Формат: /unbook YYYY-MM-DD HH:mm");
                }
            } else if (text?.startsWith('/check')) {
                const date = text.split(/\s+/)[1];
                if (date) {
                    const schedule = await Schedule.findOne({ date });
                    if (!schedule) {
                        await sendTelegramMessage(chatId, `📅 На ${date} розкладу немає`);
                    } else {
                        const bookings = await BookedSlot.find({ dateTime: { $regex: `^${date}` } });
                        const bookedTimes = new Set(bookings.map(b => b.dateTime.split('T')[1]));
                        const list = schedule.times.map((t: string) => `${t} ${bookedTimes.has(t) ? '🔴' : '🟢'}`).join('\n');
                        await sendTelegramMessage(chatId, `📅 Розклад на ${date}:\n\n${list}`);
                    }
                } else {
                    await sendTelegramMessage(chatId, "⚠️ Формат: /check YYYY-MM-DD");
                }
            } else if (text?.startsWith('/booked')) {
                const bookings = await BookedSlot.find({}).sort({ dateTime: 1 });
                const list = bookings.map((b: any) => `${b.dateTime.replace('T', ' ')} - ${b.clientName}`).join('\n') || "Нічого не знайдено";
                await sendTelegramMessage(chatId, `📕 Зайняті слоти:\n\n${list}`);
            } else if (text === '/start') {
                const adminMsg = `
👋 <b>Вітаю, Адмін!</b>

Система працює на Vercel + MongoDB.

<b>Команди:</b>
/add_slots YYYY-MM-DD 10:00,12:00
/close_day YYYY-MM-DD
/delete_day YYYY-MM-DD
/unbook YYYY-MM-DD HH:mm
/check YYYY-MM-DD
/booked
                `.trim();
                await sendTelegramMessage(chatId, adminMsg);
            }
        }
 else if (text === '/start') {
            await sendTelegramMessage(chatId, "👋 Вітаємо! Записуйтесь онлайн: " + APP_URL);
        }
    }

    if (callback_query) {
        const action = callback_query.data;
        if (action?.startsWith('cancel_')) {
            const dateTime = action.replace('cancel_', '').replace('_', 'T');
            await BookedSlot.findOneAndDelete({ dateTime });
            // We still use bot for answerCallbackQuery as it's more convenient, but we could fetch it too
            try {
                await bot.answerCallbackQuery(callback_query.id, { text: "Запис скасовано" });
            } catch (e) {}
            await sendTelegramMessage(callback_query.message.chat.id, "❌ Запис видалено");
        }
    }

    res.sendStatus(200);
});

// Setup Webhook helper
app.get('/api/setup-bot', async (req, res) => {
    try {
        if (!TOKEN) throw new Error("BOT_TOKEN is missing");
        
        // Verify token first
        const me = await bot.getMe();
        console.log(`✅ Bot verified: @${me.username}`);

        const url = `${APP_URL}/api/webhook`;
        await bot.setWebHook(url);
        
        // Set commands for admin
        if (ADMIN_CHAT_ID) {
            await bot.setMyCommands([
                { command: '/start', description: '👋 Початок' },
                { command: '/add_slots', description: '📅 Додати слоти (ГГГГ-ММ-ДД час,час)' },
                { command: '/close_day', description: '🔒 Закрити день' },
                { command: '/delete_day', description: '🗑 Видалити день' },
                { command: '/unbook', description: '🔓 Звільнити слот' },
                { command: '/check', description: '🔍 Перевірити дату' },
                { command: '/booked', description: '📕 Зайняті слоти' }
            ], {
                scope: { type: 'chat', chat_id: Number(ADMIN_CHAT_ID) }
            });
        }

        // Set commands for everyone else
        await bot.setMyCommands([
            { command: '/start', description: '👋 Початок' }
        ], {
            scope: { type: 'all_private_chats' }
        });

        res.json({ success: true, message: `Webhook set to ${url} and commands registered.` });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default app;
