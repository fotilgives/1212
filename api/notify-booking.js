import { buildBookingEmail, buildOwnerNotice, normalizeOrigin, sendTransactionalEmail } from './_mail.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Сповіщення після запису на послугу.
// POST { name, phone, email?, service?, note? }
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const service = String(body.service || '').trim();
    const note = String(body.note || '').trim();

    const origin = normalizeOrigin(process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const bannerUrl = origin ? `${origin}/images/email/welcome-banner.png` : '';
    const supportEmail = process.env.COURSE_SUPPORT_EMAIL || 'support@example.com';

    // 1) Лист клієнту (якщо вказав пошту)
    if (EMAIL_RE.test(email)) {
      const { subject, html, text } = buildBookingEmail({ name, service, phone, appUrl: origin, supportEmail, bannerUrl });
      try { await sendTransactionalEmail({ to: email, subject, html, text }); }
      catch (e) { console.error('[notify-booking] client mail ERR:', e.message); }
    }

    // 2) Сповіщення власнику
    const owner = process.env.NOTIFY_EMAIL || process.env.COURSE_SUPPORT_EMAIL || process.env.GMAIL_USER;
    if (owner) {
      const { subject, html, text } = buildOwnerNotice({
        title: '🗓️ Новий запис на послугу',
        rows: [
          ['Імʼя', name || '—'],
          ['Телефон', phone || '—'],
          ['Email', email || '—'],
          ['Послуга', service || '—'],
          ['Коментар', note || '—'],
        ],
      });
      try { await sendTransactionalEmail({ to: owner, subject, html, text }); }
      catch (e) { console.error('[notify-booking] owner mail ERR:', e.message); }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[notify-booking] ERR:', err.message);
    return res.status(500).json({ error: 'notify failed' });
  }
}
