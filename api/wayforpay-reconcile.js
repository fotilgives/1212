import { transactionList, parseTopupRef, creditTopup, s } from './_wfp.js';

/**
 * Автоматична звірка платежів (страхувальна сітка).
 *
 * Викликається клієнтом при заході на сайт. Сервер запитує в WayForPay усі
 * транзакції за останній період і дораховує монети за КОЖНЕ оплачене (Approved)
 * замовлення цього гравця, яке ще не було зараховане. Завдяки ідемпотентності
 * повторні нарахування неможливі. Це гарантує зарахування навіть якщо
 * serviceUrl-колбек і returnUrl не спрацювали.
 */
export default async function handler(req, res) {
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    body = body || {};

    let playerId = s(body.playerId);
    if (!playerId) {
      try {
        playerId = s(new URL(req.url, 'http://localhost').searchParams.get('playerId'));
      } catch {
        /* ignore */
      }
    }
    if (playerId.length < 8) return res.status(400).json({ error: 'bad playerId' });

    const now = Math.floor(Date.now() / 1000);
    const from = now - 35 * 24 * 3600; // останні 35 днів
    const list = await transactionList(from, now);

    const prefix = `TOP_${playerId}_`;
    let credited = 0;
    for (const t of list) {
      const ref = s(t.orderReference);
      if (!ref.startsWith(prefix)) continue;
      if (s(t.transactionStatus) !== 'Approved') continue;
      const { valid, coins } = parseTopupRef(ref);
      if (!valid) continue;
      const ok = await creditTopup(ref, coins, null, 'reconcile');
      if (ok) credited += 1;
    }

    return res.status(200).json({ ok: true, checked: list.length, credited });
  } catch (err) {
    console.error('[wfp-reconcile] ERR:', err.message);
    return res.status(200).json({ ok: false });
  }
}
