import { rpc, s } from './_wfp.js';
import {
  tgSend, tgAnswerCallback, tgNotifyAdmins, mainMenuKeyboard, servicesKeyboard,
  SERVICES, SERVICES_TEXT, PRICES_TEXT, CONTACTS_TEXT, SITE_URL, hasToken,
} from './_tg.js';

const GREETING =
  '👋 Вітаємо в <b>Центрі розвитку та здоровʼя</b>!\n\n' +
  'Тут можна записатися на послугу, переглянути ціни, контакти та зіграти в нашу гру.\n\n' +
  'Оберіть дію 👇';

async function getStep(chat) {
  try {
    const r = await rpc('rps_tg_session_get', { p_chat: chat });
    return { step: s(r?.step) || 'idle', data: r?.data || {} };
  } catch { return { step: 'idle', data: {} }; }
}
const setStep = (chat, step, data) => rpc('rps_tg_session_set', { p_chat: chat, p_step: step, p_data: data || {} }).catch(() => {});
const clearStep = (chat) => setStep(chat, 'idle', {});

async function startBooking(chat) {
  await setStep(chat, 'name', {});
  await tgSend(chat, '📝 Чудово! Як вас звати?');
}

async function finishBooking(chat, data) {
  const name = s(data.name), phone = s(data.phone), service = s(data.service);
  try {
    await rpc('rps_book', { p_name: name, p_phone: phone, p_service: service, p_note: 'Заявка з Telegram-бота', p_email: null });
  } catch (e) {
    console.error('[tg] rps_book ERR:', e.message);
    await tgSend(chat, '😔 Не вдалося зберегти заявку. Спробуйте ще раз: /book');
    return;
  }
  await clearStep(chat);
  await tgSend(chat,
    `✅ <b>Заявку прийнято!</b>\n\n👤 ${name}\n📞 ${phone}\n🤲 ${service}\n\nМи зателефонуємо найближчим часом, щоб узгодити час. Дякуємо! 💚`,
    { reply_markup: mainMenuKeyboard() });
  await tgNotifyAdmins(`🗓️ <b>Новий запис (Telegram)</b>\n\n👤 ${name}\n📞 ${phone}\n🤲 ${service}`);
}

export default async function handler(req, res) {
  // Telegram очікує 200 — відповідаємо завжди.
  try {
    if (req.method !== 'POST') { res.status(200).json({ ok: true }); return; }

    // Опційний захист вебхука секретом.
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
      res.status(200).json({ ok: true }); return;
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    if (!hasToken()) { res.status(200).json({ ok: true }); return; }

    // ── Натискання inline-кнопок ──
    if (body.callback_query) {
      const cq = body.callback_query;
      const chat = cq.message?.chat?.id;
      const dataStr = s(cq.data);
      await tgAnswerCallback(cq.id);
      if (chat) {
        if (dataStr === 'book') await startBooking(chat);
        else if (dataStr === 'services') await tgSend(chat, SERVICES_TEXT, { reply_markup: mainMenuKeyboard() });
        else if (dataStr === 'prices') await tgSend(chat, PRICES_TEXT, { reply_markup: mainMenuKeyboard() });
        else if (dataStr === 'contacts') await tgSend(chat, CONTACTS_TEXT, { reply_markup: mainMenuKeyboard() });
        else if (dataStr.startsWith('svc:')) {
          const idx = parseInt(dataStr.slice(4), 10);
          const service = SERVICES[idx] || SERVICES[SERVICES.length - 1];
          const st = await getStep(chat);
          await finishBooking(chat, { ...st.data, service });
        }
      }
      res.status(200).json({ ok: true }); return;
    }

    // ── Текстові повідомлення ──
    const msg = body.message || body.edited_message;
    const chat = msg?.chat?.id;
    const text = s(msg?.text).trim();
    if (!chat) { res.status(200).json({ ok: true }); return; }

    // Команди
    if (text.startsWith('/')) {
      const cmd = text.split(/[\s@]/)[0].toLowerCase();
      if (cmd === '/start' || cmd === '/menu') { await clearStep(chat); await tgSend(chat, GREETING, { reply_markup: mainMenuKeyboard() }); }
      else if (cmd === '/book') await startBooking(chat);
      else if (cmd === '/services') await tgSend(chat, SERVICES_TEXT, { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/prices') await tgSend(chat, PRICES_TEXT, { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/contacts') await tgSend(chat, CONTACTS_TEXT, { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/site' || cmd === '/game') await tgSend(chat, `🌐 ${SITE_URL}`, { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/cancel') { await clearStep(chat); await tgSend(chat, 'Скасовано. Повернутись у меню: /menu'); }
      else await tgSend(chat, 'Команда не розпізнана. Меню: /menu', { reply_markup: mainMenuKeyboard() });
      res.status(200).json({ ok: true }); return;
    }

    // Діалог запису
    const st = await getStep(chat);
    if (st.step === 'name') {
      if (text.length < 2) { await tgSend(chat, 'Вкажіть, будь ласка, імʼя (мінімум 2 літери).'); res.status(200).json({ ok: true }); return; }
      await setStep(chat, 'phone', { ...st.data, name: text });
      await tgSend(chat, '📞 Дякую! Тепер напишіть ваш номер телефону.');
    } else if (st.step === 'phone') {
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7) { await tgSend(chat, 'Схоже, номер некоректний. Напишіть телефон ще раз 🙏'); res.status(200).json({ ok: true }); return; }
      await setStep(chat, 'service', { ...st.data, phone: text });
      await tgSend(chat, '🤲 Оберіть послугу:', { reply_markup: servicesKeyboard() });
    } else {
      await tgSend(chat, GREETING, { reply_markup: mainMenuKeyboard() });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telegram] ERR:', err.message);
    try { res.status(200).json({ ok: true }); } catch { /* ignore */ }
  }
}
