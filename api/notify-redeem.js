import { buildPrizeEmail, buildOwnerNotice, normalizeOrigin, sendTransactionalEmail } from './_mail.js';
import { rpc, s } from './_wfp.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Сповіщення після обміну монет на приз.
// POST { playerId, reward, cost, nickname? }
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const playerId = s(body.playerId);
    const reward = s(body.reward);
    const cost = Number(body.cost);
    const nickname = s(body.nickname);

    const origin = normalizeOrigin(process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const bannerUrl = origin ? `${origin}/images/email/welcome-banner.png` : '';
    const profileUrl = origin ? `${origin}/#/profile` : '';
    const supportEmail = process.env.COURSE_SUPPORT_EMAIL || 'support@example.com';

    let email = '';
    if (/^[0-9a-fA-F-]{8,40}$/.test(playerId)) {
      email = s(await rpc('rps_player_email', { p_id: playerId })).trim().toLowerCase();
    }

    // 1) Лист клієнту (якщо є акаунт з поштою)
    if (EMAIL_RE.test(email)) {
      const { subject, html, text } = buildPrizeEmail({
        name: nickname, reward, cost: Number.isFinite(cost) ? cost : undefined, profileUrl, supportEmail, bannerUrl,
      });
      try { await sendTransactionalEmail({ to: email, subject, html, text }); }
      catch (e) { console.error('[notify-redeem] client mail ERR:', e.message); }
    }

    // 2) Сповіщення власнику
    const owner = process.env.NOTIFY_EMAIL || process.env.COURSE_SUPPORT_EMAIL || process.env.GMAIL_USER;
    if (owner) {
      const { subject, html, text } = buildOwnerNotice({
        title: '🎁 Новий обмін на приз',
        rows: [
          ['Гравець', nickname || playerId || '—'],
          ['Email', email || '— (гість без пошти)'],
          ['Приз', reward || '—'],
          ['Списано монет', Number.isFinite(cost) ? String(cost) : '—'],
        ],
      });
      try { await sendTransactionalEmail({ to: owner, subject, html, text }); }
      catch (e) { console.error('[notify-redeem] owner mail ERR:', e.message); }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[notify-redeem] ERR:', err.message);
    return res.status(500).json({ error: 'notify failed' });
  }
}
