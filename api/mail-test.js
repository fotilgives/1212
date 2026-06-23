import { buildWelcomeEmail, normalizeOrigin, sendTransactionalEmail } from './_mail.js';

// ТИМЧАСОВИЙ діагностичний ендпоінт для перевірки відправки пошти.
// GET /api/mail-test?token=diag-2026&to=you@gmail.com
// Повертає, чи задані GMAIL-змінні, і результат відправки. Прибрати після перевірки.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default async function handler(req, res) {
  const env = {
    has_user: !!process.env.GMAIL_USER,
    has_pass: !!process.env.GMAIL_APP_PASSWORD,
    has_from: !!process.env.GMAIL_FROM,
  };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.searchParams.get('token') !== 'diag-2026') {
      return res.status(403).json({ error: 'forbidden', env });
    }
    const to = String(url.searchParams.get('to') || '').trim();
    if (!EMAIL_RE.test(to)) return res.status(400).json({ error: 'bad email', env });

    const origin = normalizeOrigin(process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const bannerUrl = origin ? `${origin}/images/email/welcome-banner.png` : '';
    const { subject, html, text } = buildWelcomeEmail({
      name: 'Тест',
      appUrl: origin || 'https://reabilitolog-play.vercel.app',
      supportEmail: process.env.COURSE_SUPPORT_EMAIL || 'support@example.com',
      bannerUrl,
    });
    await sendTransactionalEmail({ to, subject, html, text });
    return res.status(200).json({ ok: true, to, env });
  } catch (err) {
    return res.status(500).json({ error: String((err && err.message) || err), env });
  }
}
