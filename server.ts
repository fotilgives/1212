
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import cors from 'cors';

// --- CONFIGURATION ---
const TOKEN = process.env.BOT_TOKEN || "8299961218:AAEanmyul1h3efDzXJZGICJYxQlKf5ERKJg";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "8200508213";
const MONGO_URI = process.env.MONGO_URI || process.env.myDatabase || "mongodb+srv://artemkamazur12_db_user:Svetlana2026@cluster0.ujv7pgy.mongodb.net/beauty_salon?appName=Cluster0";
const PORT = 3000;

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
    clientTelegramId: String,
    createdAt: { type: Date, default: Date.now }
});

const Schedule = mongoose.model('Schedule', scheduleSchema, 'schedules');
const BookedSlot = mongoose.model('BookedSlot', bookedSlotSchema, 'bookedslots');

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
            .then(() => console.log('✅ Connected to MongoDB (Database: beauty_salon)'))
            .catch(err => console.error('❌ MongoDB Connection Error:', err));
    }

    // --- API ENDPOINTS ---
    app.get('/api/slots', async (req, res) => {
        const { date } = req.query;
        console.log(`🔍 API: Fetching slots for date: [${date}]`);
        if (!date) return res.status(400).json({ error: 'Date required' });
        try {
            const scheduleDoc = await Schedule.findOne({ date: String(date).trim() });
            
            if (scheduleDoc?.isClosed) {
                return res.json({ isClosed: true, slots: [] });
            }

            const availableTimes = scheduleDoc ? scheduleDoc.times : [];
            console.log(`📊 API: Found ${availableTimes.length} slots for ${date}`);
            const bookedDocs = await BookedSlot.find({ dateTime: { $regex: `^${date}` } });
            const bookedTimeStrings = bookedDocs.map(doc => doc.dateTime);
            const slots = availableTimes.map(time => ({
                time: String(time).trim(),
                isBooked: bookedTimeStrings.includes(`${date}T${String(time).trim()}`)
            }));
            res.json({ isClosed: false, slots });
        } catch (error) {
            console.error('❌ API Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    app.post('/api/book', async (req, res) => {
        const { name, phone, service, date, time, telegramId } = req.body;
        if (!name || !phone || !date || !time) return res.status(400).json({ error: 'Missing fields' });

        // Save pending booking info to help with contact matching later
        const dateTime = `${date}T${time}`;
        try {
            // We don't mark it as fully booked yet, but we store the info
            // If it's already booked, we might want to handle that, but for now let's just store the request
            await BookedSlot.findOneAndUpdate(
                { dateTime }, 
                { clientName: name, clientPhone: phone, clientTelegramId: telegramId }, 
                { upsert: true }
            );
        } catch (e) { console.error("Error saving pending booking", e); }

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
    // Set commands only for admin
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

    // Set simple start command for everyone else
    bot.setMyCommands([
        { command: '/start', description: '👋 Початок' }
    ], {
        scope: { type: 'all_private_chats' }
    });

    bot.onText(/\/start(.*)/, (msg, match) => {
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
    bot.on('contact', async (msg) => {
        const chatId = msg.chat.id;
        const contact = msg.contact;
        if (!contact) return;

        let phone = contact.phone_number;
        if (!phone.startsWith('+')) phone = '+' + phone;

        try {
            // Find bookings with this phone number but no telegramId
            const bookings = await BookedSlot.find({ clientPhone: phone });
            
            if (bookings.length > 0) {
                await BookedSlot.updateMany({ clientPhone: phone }, { clientTelegramId: String(chatId) });
                bot.sendMessage(chatId, "✅ <b>Дякуємо!</b> Ваш номер підтверджено. Тепер ми зможемо надіслати вам сповіщення про статус вашого запису.", { parse_mode: 'HTML' });
                
                // Notify admin that a client shared their contact
                bot.sendMessage(ADMIN_CHAT_ID, `📱 Клієнт <b>${contact.first_name}</b> (${phone}) поділився контактом. Тепер він отримуватиме сповіщення!`, { parse_mode: 'HTML' });
            } else {
                bot.sendMessage(chatId, "✅ <b>Дякуємо!</b> Ваш номер збережено. Тепер ви можете записатися на послуги, і ми надішлемо вам підтвердження.", { parse_mode: 'HTML' });
            }
        } catch (error) {
            console.error("Error handling contact:", error);
        }
    });

    // Command: /add_slots 2025-02-20 10:00,12:00
    bot.onText(/\/add_slots (.+)/, async (msg, match) => {
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
        const times = timesStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
        
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
    bot.onText(/\/close_day (.+)/, async (msg, match) => {
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
    bot.onText(/\/delete_day (.+)/, async (msg, match) => {
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
    bot.onText(/\/unbook (.+)/, async (msg, match) => {
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
                        const clientMessage = `✨ <b>Ваш запис підтверджено!</b>\n\n📅 Дата: ${date}\n⏰ Час: ${time}\n\nЧекаємо на вас у Svetlana Mazur!`;
                        await bot.sendMessage(clientTelegramId, clientMessage, { parse_mode: 'HTML' });
                        notificationStatus = "\n🔔 <b>Сповіщення надіслано клієнту в Telegram!</b>";
                    } catch (tgErr) {
                        notificationStatus = "\n⚠️ <b>Клієнт не отримав повідомлення (можливо, не запустив бота).</b>";
                    }
                } else {
                    notificationStatus = "\nℹ️ <b>Клієнт не отримав повідомлення (ID не знайдено).</b>";
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
