
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';
import nodemailer from 'nodemailer';

// --- CONFIGURATION ---
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const MONGO_URI = process.env.MONGO_URI || process.env.myDatabase;
const PORT = 3000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

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

const Schedule = mongoose.model('Schedule', scheduleSchema, 'schedules');
const BookedSlot = mongoose.model('BookedSlot', bookedSlotSchema, 'bookedslots');

async function startServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Initialize Bot
    if (!TOKEN) {
        console.error('❌ BOT_TOKEN is missing!');
        return;
    }
    const bot = new TelegramBot(TOKEN, { polling: true });

    // Initialize Nodemailer
    let transporter: any = null;
    if (EMAIL_USER && EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        });
        console.log('✅ Email transporter initialized');
    } else {
        console.warn('⚠️ Email credentials missing. Email notifications disabled.');
    }

    bot.on('polling_error', (error: any) => {
        if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
            console.error('❌ Telegram Bot Conflict: Інша копія цього бота вже запущена (наприклад, на Render або локально).');
            console.error('Будь ласка, зупиніть інші інстанції бота або змініть токен.');
        } else if (error.code === 'ETELEGRAM' && error.message.includes('401 Unauthorized')) {
            console.error('❌ Telegram Bot Token Invalid: Токен бота недійсний або був відкликаний.');
            console.error('Перевірте змінну середовища BOT_TOKEN на Render або у файлі .env.');
            // Stop polling to prevent spamming logs
            bot.stopPolling();
        } else {
            console.error('⚠️ Telegram Polling Error:', error.message);
        }
    });

    // Connect to MongoDB with optimized settings
    if (MONGO_URI) {
        mongoose.connect(MONGO_URI, { 
            dbName: 'beauty_salon',
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        })
            .then(() => console.log('✅ Connected to MongoDB (Database: beauty_salon)'))
            .catch(err => console.error('❌ MongoDB Connection Error:', err));
    }

    // Ensure indexes for faster queries
    // This runs in the background and won't block startup
    Schedule.schema.index({ date: 1 });
    BookedSlot.schema.index({ dateTime: 1 });

    // --- API ENDPOINTS ---
    app.get('/api/slots', async (req: express.Request, res: express.Response) => {
        const { date } = req.query;
        console.log(`🔍 API: Fetching slots for date: [${date}]`);
        if (!date) return res.status(400).json({ error: 'Date required' });
        try {
            const scheduleDoc = await Schedule.findOne({ date: String(date).trim() });
            
            if (scheduleDoc?.isClosed) {
                return res.json({ isClosed: true, slots: [] });
            }

            const availableTimes = scheduleDoc ? scheduleDoc.times : [];
            
            // Optimized query: Use $in operator instead of regex if possible, or at least limit fields
            // Since we need to check if specific times are booked, let's construct the exact dateTime strings we care about
            const potentialBookings = availableTimes.map(time => `${date}T${time.trim()}`);
            
            // Find only the bookings that match our available slots for this day
            // This is much faster than regex scanning the whole collection
            const bookedDocs = await BookedSlot.find({ 
                dateTime: { $in: potentialBookings } 
            }).select('dateTime'); // Only fetch the dateTime field, we don't need the rest
            
            const bookedTimeSet = new Set(bookedDocs.map(doc => doc.dateTime));
            
            const slots = availableTimes.map(time => ({
                time: String(time).trim(),
                isBooked: bookedTimeSet.has(`${date}T${String(time).trim()}`)
            }));
            res.json({ isClosed: false, slots });
        } catch (error) {
            console.error('❌ API Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/api/book', async (req: express.Request, res: express.Response) => {
        const { name, phone, email, service, date, time, telegramId } = req.body;
        if (!name || !phone || !email || !date || !time) return res.status(400).json({ error: 'Missing fields' });

        // Save booking immediately (Auto-confirm)
        const dateTime = `${date}T${time}`;
        try {
            await BookedSlot.findOneAndUpdate(
                { dateTime }, 
                { clientName: name, clientPhone: phone, clientEmail: email, clientTelegramId: telegramId, service: service }, 
                { upsert: true }
            );
        } catch (e) { console.error("Error saving booking", e); }

        const [year, month, day] = date.split('-');
        const formattedDate = `${day}.${month}.${year}`;

        // 1. Send Email to Client Immediately
        if (email && transporter) {
            const htmlContent = `
            <div style="background-color: #f5f5f0; padding: 40px; font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <h2 style="color: #c5a059; text-align: center; margin-bottom: 30px; font-weight: 300; text-transform: uppercase; letter-spacing: 2px;">Ваша зустріч підтверджена!</h2>
                    
                    <p style="text-align: center; font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #555;">
                        Світлана Мазур чекає на вас.
                    </p>

                    <div style="background-color: #fafafa; padding: 20px; border-radius: 6px; border: 1px solid #eee;">
                        <p style="margin: 10px 0; font-size: 15px;">✂️ <strong>Послуга:</strong> ${service}</p>
                        <p style="margin: 10px 0; font-size: 15px;">📅 <strong>Дата:</strong> ${formattedDate}</p>
                        <p style="margin: 10px 0; font-size: 15px;">⏰ <strong>Час:</strong> ${time}</p>
                    </div>

                    <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px;">
                        <p>📍 м. Вінниця, вул. Князів Коріатовичів, 106</p>
                        <p><a href="https://svetlana-mazur.vercel.app" style="color: #c5a059; text-decoration: none;">svetlana-mazur.vercel.app</a></p>
                    </div>
                </div>
            </div>
            `;

            try {
                await transporter.sendMail({
                    from: `"Svetlana Mazur" <${EMAIL_USER}>`,
                    to: email,
                    subject: 'Підтвердження запису | Svetlana Mazur',
                    html: htmlContent
                });
                console.log(`✅ Email sent to ${email}`);
            } catch (emailErr) {
                console.error('❌ Email error:', emailErr);
            }
        }

        // 2. Notify Admin (Info only, with Cancel option)
        const message = `
✅ <b>Новий запис (Автоматично підтверджено)!</b>

👤 <b>Клієнт:</b> ${name}
📞 <b>Телефон:</b> ${phone}
📧 <b>Email:</b> ${email}
✂️ <b>Послуга:</b> ${service}
📅 <b>Дата:</b> ${formattedDate}
⏰ <b>Час:</b> ${time}
${telegramId ? `🆔 <b>Telegram ID:</b> <code>${telegramId}</code>` : ''}

<i>Лист клієнту вже відправлено.</i>
        `.trim();

        try {
            if (ADMIN_CHAT_ID) {
                await bot.sendMessage(ADMIN_CHAT_ID, message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "❌ Скасувати запис", callback_data: `cancel_${date}_${time}` }
                            ]
                        ]
                    }
                });
            }
            res.json({ success: true });
        } catch (error: any) {
            console.error('Error sending message to admin:', error);
            res.status(500).json({ error: `Помилка Telegram: ${error.message}` });
        }
    });

    // --- TELEGRAM BOT LOGIC ---
    // Set commands only for admin
    if (ADMIN_CHAT_ID) {
        bot.setMyCommands([
            { command: '/start', description: '👋 Початок роботи' },
            { command: '/add_slots', description: '📅 Додати слоти' },
            { command: '/close_day', description: '🔒 Закрити день' },
            { command: '/delete_day', description: '🗑 Видалити день' },
            { command: '/unbook', description: '🔓 Звільнити слот' },
            { command: '/check', description: '🔍 Перевірити дату' },
            { command: '/booked', description: '📕 Зайняті слоти' }
        ], {
            scope: { type: 'chat', chat_id: Number(ADMIN_CHAT_ID) }
        }).then(() => console.log('✅ Admin menu set'));
    }

    // Set simple start command for everyone else
    bot.setMyCommands([
        { command: '/start', description: '👋 Початок' }
    ], {
        scope: { type: 'all_private_chats' }
    });

    bot.onText(/\/start(.*)/, (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        const chatId = msg.chat.id;
        const payload = match ? match[1].trim() : '';

        if (payload === 'booking_success') {
            bot.sendMessage(chatId, "✨ <b>Дякуємо за ваш запис!</b>\n\nВаша заявка надіслана майстру. Будь ласка, <b>очікуйте підтвердження замовлення</b>. Ми надішлемо вам повідомлення тут, як тільки запис буде підтверджено.", { parse_mode: 'HTML' });
            return;
        }

        if (String(chatId) !== ADMIN_CHAT_ID) {
            bot.sendMessage(chatId, 
                "👋 <b>Вітаємо у Svetlana Mazur!</b>\n\n" +
                "Тут ви можете швидко записатися на фарбування або догляд за волоссям.\n\n" +
                "🔔 <b>Важливо:</b> Щоб ми могли надіслати вам підтвердження, будь ласка, натисніть кнопку нижче <b>\"Надіслати номер телефону\"</b>.", 
                { 
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [
                            [{ text: "📱 Надіслати номер телефону", request_contact: true }]
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                }
            );
            
            // Also send the WebApp button
            bot.sendMessage(chatId, "Або одразу переходьте до запису:", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { 
                                text: "📅 Записатися онлайн", 
                                web_app: { url: "https://svetlana-hair-bot.onrender.com" } 
                            }
                        ]
                    ]
                }
            });
            return;
        }

        bot.sendMessage(chatId, 
            "👋 <b>Вітаю, Адмін!</b>\n\n" +
            "Система працює на хмарній базі даних (MongoDB).\n\n" +
            "<b>Команди:</b>\n" +
            "/add_slots YYYY-MM-DD 10:00,12:00\n" +
            "<i>(Приклад: /add_slots 2025-05-20 10:00,14:00)</i>\n\n" +
            "/close_day YYYY-MM-DD\n" +
            "<i>(Зробити день недоступним для запису)</i>\n\n" +
            "/delete_day YYYY-MM-DD\n" +
            "<i>(Видалити розклад ТА всі записи на цей день)</i>\n\n" +
            "/unbook YYYY-MM-DD HH:mm\n" +
            "<i>(Звільнити конкретний час, наприклад: /unbook 2026-02-25 10:00)</i>\n\n" +
            "/check YYYY-MM-DD\n" +
            "/booked", 
            { parse_mode: 'HTML' }
        );
    });

    // Handle contact sharing
    bot.on('contact', async (msg: TelegramBot.Message) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        if (!contact) return;

        let phone = contact.phone_number;
        if (!phone.startsWith('+')) phone = '+' + phone;

        try {
            // Find bookings with this phone number
            const bookings = await BookedSlot.find({ clientPhone: phone });
            
            if (bookings.length > 0) {
                await BookedSlot.updateMany({ clientPhone: phone }, { clientTelegramId: String(chatId) });
                bot.sendMessage(chatId, "✅ <b>Дякуємо!</b> Ваш номер підтверджено. Тепер ми зможемо надіслати вам сповіщення про статус вашого запису.", { parse_mode: 'HTML' });
                
                // If there are bookings, send confirmation for each one
                for (const booking of bookings) {
                    const [date, time] = booking.dateTime.split('T');
                    const [year, month, day] = date.split('-');
                    const formattedDate = `${day}.${month}.${year}`;
                    
                    const service = booking.service || "Перукарські послуги";
                    const clientMessage = 
                        `Світлана підтвердила ваш запис! ✨\n\n` +
                        `✂️ Послуга: ${service}\n` +
                        `📅 Дата: ${formattedDate}\n` +
                        `⏰ Час: ${time}\n\n` +
                        `📍 Адреса: м. Вінниця, вул. Князів Коріатовичів, 106\n` +
                        `🌐 Сайт: https://svetlana-mazur.vercel.app`;
                    
                    await bot.sendMessage(chatId, clientMessage, { parse_mode: 'HTML' });
                }

                // Notify admin that a client shared their contact
                if (ADMIN_CHAT_ID) {
                    bot.sendMessage(ADMIN_CHAT_ID, `📱 Клієнт <b>${contact.first_name}</b> (${phone}) поділився контактом. Тепер він отримуватиме сповіщення!`, { parse_mode: 'HTML' });
                }
            } else {
                bot.sendMessage(chatId, "✅ <b>Дякуємо!</b> Ваш номер збережено. Тепер ви можете записатися на послуги, і ми надішлемо вам підтвердження.", { parse_mode: 'HTML' });
            }
        } catch (error) {
            console.error("Error handling contact:", error);
        }
    });

    // Command: /add_slots 2025-02-20 10:00,12:00
    bot.onText(/\/add_slots (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
        const input = match ? match[1].trim() : ''; 
        // Handle both spaces and newlines as separators between date and times
        const parts = input.split(/\s+/);
        const date = parts[0];
        const timesStr = parts[1];

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            bot.sendMessage(msg.chat.id, "⚠️ <b>Помилка формату дати!</b>\nПотрібно: РРРР-ММ-ДД.\nПриклад: <code>/add_slots 2026-02-25 10:00,12:00</code>", { parse_mode: 'HTML' });
            return;
        }
        if (!date || !timesStr) {
            bot.sendMessage(msg.chat.id, "⚠️ Формат: /add_slots YYYY-MM-DD HH:mm,HH:mm");
            return;
        }
        // Split times and trim each one
        const times = timesStr.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
        
        try {
            await Schedule.findOneAndUpdate({ date }, { times, isClosed: false }, { upsert: true, new: true });
            console.log(`✅ Bot: Saved ${times.length} slots for ${date}`);
            bot.sendMessage(msg.chat.id, `✅ <b>Слоти збережено для ${date}:</b>\n${times.join('\n')}`, { parse_mode: 'HTML' });
        } catch (error) {
            console.error('❌ Bot Save Error:', error);
            bot.sendMessage(msg.chat.id, "❌ Помилка збереження.");
        }
    });

    // Command: /close_day YYYY-MM-DD
    bot.onText(/\/close_day (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
        const date = match ? match[1].trim() : '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            bot.sendMessage(msg.chat.id, "⚠️ Формат: /close_day YYYY-MM-DD");
            return;
        }
        try {
            await Schedule.findOneAndUpdate({ date }, { isClosed: true, times: [] }, { upsert: true, new: true });
            bot.sendMessage(msg.chat.id, `🔒 <b>День ${date} закрито для запису!</b>\nНа сайті він буде відображатися як недоступний.`, { parse_mode: 'HTML' });
        } catch (error) {
            bot.sendMessage(msg.chat.id, "❌ Помилка закриття дня.");
        }
    });

    // Command: /delete_day YYYY-MM-DD
    bot.onText(/\/delete_day (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
        const date = match ? match[1].trim() : '';
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            bot.sendMessage(msg.chat.id, "⚠️ Формат: /delete_day YYYY-MM-DD");
            return;
        }
        try {
            // Видаляємо розклад
            const scheduleResult = await Schedule.findOneAndDelete({ date });
            // Видаляємо всі бронювання на цей день
            const bookedResult = await BookedSlot.deleteMany({ dateTime: { $regex: `^${date}` } });
            
            let response = `🗑 <b>День ${date} повністю очищено!</b>\n`;
            if (scheduleResult) response += `• Розклад видалено\n`;
            if (bookedResult.deletedCount > 0) response += `• Видалено бронювань: ${bookedResult.deletedCount}\n`;
            
            bot.sendMessage(msg.chat.id, response, { parse_mode: 'HTML' });
        } catch (error) {
            bot.sendMessage(msg.chat.id, "❌ Помилка видалення.");
        }
    });

    // Command: /unbook YYYY-MM-DD HH:mm
    bot.onText(/\/unbook (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;
        const input = match ? match[1].trim() : '';
        const [date, time] = input.split(/\s+/);
        
        if (!date || !time) {
            bot.sendMessage(msg.chat.id, "⚠️ Формат: /unbook YYYY-MM-DD HH:mm");
            return;
        }

        const dateTime = `${date}T${time}`;
        try {
            const result = await BookedSlot.findOneAndDelete({ dateTime });
            if (result) {
                bot.sendMessage(msg.chat.id, `🔓 <b>Слот ${date} о ${time} тепер вільний!</b>`, { parse_mode: 'HTML' });
            } else {
                bot.sendMessage(msg.chat.id, `🤔 Запису на ${date} о ${time} не знайдено.`);
            }
        } catch (error) {
            bot.sendMessage(msg.chat.id, "❌ Помилка при звільненні слоту.");
        }
    });

    // Command: /check YYYY-MM-DD
    bot.onText(/\/check (.+)/, async (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
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
    bot.onText(/\/booked/, async (msg: TelegramBot.Message) => {
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

    bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
        // Check DB connection
        if (mongoose.connection.readyState !== 1) {
            await bot.answerCallbackQuery(query.id, { text: "⏳ З'єднання з БД...", show_alert: true });
            return;
        }

        const action = query.data;
        const msg = query.message;
        if (!msg) return;
        const chatId = msg.chat.id;
        const messageId = msg.message_id;

        if (String(chatId) !== ADMIN_CHAT_ID) return;

        if (action?.startsWith('cancel_')) {
            const parts = action.split('_');
            const date = parts[1];
            const time = parts[2];
            const dateTime = `${date}T${time}`;

            try {
                // Delete booking from DB
                await BookedSlot.findOneAndDelete({ dateTime });

                await bot.editMessageText(`${msg.text}\n\n❌ ЗАПИС СКАСОВАНО`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'HTML'
                });
                await bot.answerCallbackQuery(query.id, { text: "Запис видалено" });
            } catch (error) {
                console.error(error);
                await bot.answerCallbackQuery(query.id, { text: "Помилка БД!", show_alert: true });
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
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        app.use(express.static('dist'));
        app.get('*', (req: express.Request, res: express.Response) => {
            res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer();
