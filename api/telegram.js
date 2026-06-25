import { rpc, s } from './_wfp.js';
import {
  tgSend, tgAnswerCallback, tgNotifyAdmins, mainMenuKeyboard, servicesKeyboard,
  SERVICES, SERVICES_TEXT, PRICES_TEXT, CONTACTS_TEXT, SITE_URL, hasToken, ADMIN_IDS,
} from './_tg.js';

const GREETING =
  '👋 Вітаємо в <b>Центрі розвитку та здоровʼя</b>!\n\n' +
  'Тут можна записатися на послугу, переглянути ціни, контакти та зіграти в нашу гру.\n\n' +
  'Оберіть дію 👇';

// Тексти послуг/цін будуємо з бази (редагуються в адмінці). Фолбек — статичні.
async function servicesText() {
  try {
    const rows = await rpc('rps_services_list');
    if (Array.isArray(rows) && rows.length) {
      const list = rows.map((r) => `• <b>${s(r.title)}</b>${r.short ? ` — ${s(r.short)}` : ''}`).join('\n');
      return `🤲 <b>Наші послуги</b>\n\n${list}\n\nНатисни «📝 Записатися», щоб залишити заявку.`;
    }
  } catch (e) { console.error('[tg] servicesText ERR:', e.message); }
  return SERVICES_TEXT;
}
async function pricesText() {
  try {
    const rows = await rpc('rps_prices_list');
    if (Array.isArray(rows) && rows.length) {
      const groups = {};
      for (const r of rows) { (groups[r.group_title] = groups[r.group_title] || []).push(r); }
      let out = '💸 <b>Прайс</b>\n';
      for (const g of Object.keys(groups)) {
        out += `\n<b>${s(g)}</b>\n`;
        out += groups[g].map((r) => `• ${s(r.name)} — ${s(r.price)} грн${r.meta ? ` (${s(r.meta)})` : ''}`).join('\n') + '\n';
      }
      return out.trim();
    }
  } catch (e) { console.error('[tg] pricesText ERR:', e.message); }
  return PRICES_TEXT;
}

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
        else if (dataStr === 'services') await tgSend(chat, await servicesText(), { reply_markup: mainMenuKeyboard() });
        else if (dataStr === 'prices') await tgSend(chat, await pricesText(), { reply_markup: mainMenuKeyboard() });
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
      else if (cmd === '/services') await tgSend(chat, await servicesText(), { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/prices') await tgSend(chat, await pricesText(), { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/contacts') await tgSend(chat, CONTACTS_TEXT, { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/site' || cmd === '/game') await tgSend(chat, `🌐 ${SITE_URL}`, { reply_markup: mainMenuKeyboard() });
      else if (cmd === '/cancel') { await clearStep(chat); await tgSend(chat, 'Скасовано. Повернутись у меню: /menu'); }
      else if (cmd === '/password' || cmd === '/changepassword') {
        if (!ADMIN_IDS.includes(String(chat))) {
          await tgSend(chat, '❌ У вас немає прав для виконання цієї команди.');
          res.status(200).json({ ok: true }); return;
        }
        const args = text.slice(cmd.length).trim();
        if (!args) {
          await tgSend(chat, '🔑 Використання: <code>/password новий_пароль</code>');
          res.status(200).json({ ok: true }); return;
        }
        try {
          const result = await rpc('rps_tg_change_admin_password', { p_new_password: args });
          if (result === 'ok') {
            await tgSend(chat, '✅ Пароль адміністратора успішно змінено!');
          } else if (result === 'password_short') {
            await tgSend(chat, '⚠️ Пароль занадто короткий (мінімум 4 символи).');
          } else {
            await tgSend(chat, `❌ Помилка: ${result}`);
          }
        } catch (e) {
          console.error('[tg] change password ERR:', e.message);
          await tgSend(chat, '❌ Не вдалося змінити пароль.');
        }
        res.status(200).json({ ok: true }); return;
      }
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
