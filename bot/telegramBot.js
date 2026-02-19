
/**
 * TELEGRAM BOT LOGIC
 * Note: This code requires a Node.js server to run. It cannot run directly in the browser.
 * Install dependencies: npm install node-telegram-bot-api
 */

const TelegramBot = require('node-telegram-bot-api');

// Configuration
const TOKEN = "8299961218:AAGLitau59BpwqlNA3IfiXjQK0wRw0xf4qk"; 
const ADMIN_CHAT_ID = "8200508213";

const bot = new TelegramBot(TOKEN, { polling: true });

// MOCK DATABASES (In production, use MongoDB or PostgreSQL)
const bookedSlots = new Set(); // Stores "YYYY-MM-DDTHH:mm"
const availableSchedule = {}; // Stores { "YYYY-MM-DD": ["10:00", "12:00"] }

console.log('Bot is running...');

// --- ADMIN COMMAND: /add_slots YYYY-MM-DD 10:00,12:00,14:00 ---
bot.onText(/\/add_slots (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (String(chatId) !== ADMIN_CHAT_ID) return;

    const input = match[1]; // "2025-02-20 10:00,12:00"
    const [date, timesStr] = input.split(' ');
    
    if (!date || !timesStr) {
        bot.sendMessage(chatId, "Format: /add_slots YYYY-MM-DD HH:mm,HH:mm");
        return;
    }

    const times = timesStr.split(',');
    availableSchedule[date] = times;

    bot.sendMessage(chatId, `✅ <b>Slots added for ${date}:</b>\n${times.join('\n')}`, { parse_mode: 'HTML' });
    console.log(`Updated schedule for ${date}:`, times);
});

// --- ADMIN COMMAND: /check_schedule YYYY-MM-DD ---
bot.onText(/\/check_schedule (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    if (String(chatId) !== ADMIN_CHAT_ID) return;
    
    const date = match[1];
    const slots = availableSchedule[date];

    if (!slots) {
        bot.sendMessage(chatId, `No slots defined for ${date}`);
    } else {
        bot.sendMessage(chatId, `📅 <b>${date}</b>:\n${slots.join('\n')}`, { parse_mode: 'HTML' });
    }
});

// --- HANDLE CALLBACK QUERIES (Approve/Decline) ---
bot.on('callback_query', async (query) => {
    const action = query.data;
    const msg = query.message;
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    // Verify admin
    if (String(chatId) !== ADMIN_CHAT_ID) {
        return bot.answerCallbackQuery(query.id, { text: "Unauthorized" });
    }

    if (action.startsWith('approve_')) {
        // Parse date/time from callback_data: approve_2025-02-20_10:00
        const parts = action.split('_');
        const date = parts[1];
        const time = parts[2];
        const dateTime = `${date}T${time}`;

        // "Block" the slot
        bookedSlots.add(dateTime);

        // Edit the message to show "Approved"
        const originalText = msg.text;
        await bot.editMessageText(`${originalText}\n\n✅ <b>ЗАПИС ПІДТВЕРДЖЕНО</b>`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML'
        });

        await bot.answerCallbackQuery(query.id, { text: `Time ${time} blocked!` });

    } else if (action.startsWith('decline_')) {
        const originalText = msg.text;
        
        // Edit the message to show "Declined"
        await bot.editMessageText(`${originalText}\n\n❌ <b>ЗАПИС ВІДХИЛЕНО</b>`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML'
        });

        await bot.answerCallbackQuery(query.id, { text: "Request declined" });
    }
});

// Admin Command: /booked to view booked slots
bot.onText(/\/booked/, (msg) => {
    if (String(msg.chat.id) !== ADMIN_CHAT_ID) return;

    if (bookedSlots.size === 0) {
        bot.sendMessage(msg.chat.id, "No active bookings.");
        return;
    }

    let response = "<b>Booked Slots:</b>\n";
    bookedSlots.forEach(slot => {
        response += `- ${slot.replace('T', ' ')}\n`;
    });

    bot.sendMessage(msg.chat.id, response, { parse_mode: 'HTML' });
});
