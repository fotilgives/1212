import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

/**
 * serviceUrl для поповнення монет. WayForPay надсилає статус транзакції.
 * Перевіряємо підпис, і якщо платіж Approved — нараховуємо монети в Supabase.
 */
const SECRET = process.env.WFP_MERCHANT_SECRET || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ewtybyrtdvhibdtdvrmq.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI5ODcsImV4cCI6MjA5MTA0ODk4N30.VjWnmvh8tw1GSIBJYWbJ8o5dYBkCj5pOUj2zoTPHmyg';

export default async function handler(req, res) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const orderReference = String(body.orderReference || '');
  const transactionStatus = String(body.transactionStatus || '');

  // Перевірка підпису вхідного запиту WayForPay.
  const incomingSource = [
    body.merchantAccount,
    orderReference,
    body.amount,
    body.currency,
    body.authCode,
    body.cardPan,
    transactionStatus,
    body.reasonCode,
  ].join(';');
  const expected = crypto.createHmac('md5', SECRET).update(incomingSource, 'utf8').digest('hex');
  const valid = expected === body.merchantSignature;

  if (valid && transactionStatus === 'Approved') {
    // orderReference = TOP_<playerId>_<coins>_<ts>
    const parts = orderReference.split('_');
    const playerId = parts[1];
    const coins = parseInt(parts[2], 10);
    if (playerId && Number.isFinite(coins) && coins > 0) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await supabase.rpc('rps_topup', { p_id: playerId, p_nick: 'Гравець', p_amount: coins });
      } catch {
        /* нарахування не вдалося — WayForPay повторить callback */
      }
    }
  }

  // Підтвердження для WayForPay.
  const time = Math.floor(Date.now() / 1000);
  const status = 'accept';
  const signature = crypto
    .createHmac('md5', SECRET)
    .update([orderReference, status, String(time)].join(';'), 'utf8')
    .digest('hex');
  res.status(200).json({ orderReference, status, time, signature });
}
