import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI5ODcsImV4cCI6MjA5MTA0ODk4N30.VjWnmvh8tw1GSIBJYWbJ8o5dYBkCj5pOUj2zoTPHmyg';

export default async function handler(req, res) {
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const {
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode, merchantSignature,
    } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Перевіряємо підпис через Postgres
    const inSigStr = [
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode,
    ].join(';');

    const { data: expected } = await supabase.rpc('wfp_sign', { p_data: inSigStr });
    const valid = expected && expected === merchantSignature;

    // Нараховуємо монети якщо платіж підтверджений
    if (valid && transactionStatus === 'Approved') {
      const parts    = String(orderReference || '').split('_');
      // orderReference = TOP_<playerId>_<coins>_<timestamp>
      const playerId = parts[1];
      const coins    = parseInt(parts[2], 10);
      if (playerId && Number.isFinite(coins) && coins > 0) {
        await supabase.rpc('rps_topup', { p_id: playerId, p_nick: 'Гравець', p_amount: coins });
      }
    }

    // Підпис відповіді WayForPay
    const { data: merchant } = await supabase.rpc('wfp_merchant');
    const time = Math.floor(Date.now() / 1000);
    const { data: signature } = await supabase.rpc('wfp_sign', {
      p_data: [merchant || merchantAccount, orderReference, 'accept', String(time)].join(';'),
    });

    return res.status(200).json({
      orderReference: orderReference || '',
      status:    'accept',
      time,
      signature: signature || '',
    });
  } catch (err) {
    console.error('callback error:', err);
    // Завжди повертаємо accept щоб WayForPay не повторював запит
    return res.status(200).json({
      orderReference: req.body?.orderReference || '',
      status: 'accept',
      time:   Math.floor(Date.now() / 1000),
      signature: '',
    });
  }
}
