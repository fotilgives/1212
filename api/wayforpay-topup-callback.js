import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI5ODcsImV4cCI6MjA5MTA0ODk4N30.VjWnmvh8tw1GSIBJYWbJ8o5dYBkCj5pOUj2zoTPHmyg';

export default async function handler(req, res) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  const {
    merchantAccount, orderReference, amount, currency,
    authCode, cardPan, transactionStatus, reasonCode, merchantSignature,
  } = body;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Перевіряємо підпис через Postgres (секрет в БД)
  const inSigStr = [merchantAccount, orderReference, amount, currency,
                    authCode, cardPan, transactionStatus, reasonCode].join(';');
  const { data: expected } = await supabase.rpc('wfp_sign', { p_data: inSigStr });
  const valid = expected === merchantSignature;

  if (valid && transactionStatus === 'Approved') {
    // orderReference = TOP_<playerId>_<coins>_<ts>
    const parts    = String(orderReference).split('_');
    const playerId = parts[1];
    const coins    = parseInt(parts[2], 10);
    if (playerId && Number.isFinite(coins) && coins > 0) {
      await supabase.rpc('rps_topup', { p_id: playerId, p_nick: 'Гравець', p_amount: coins });
    }
  }

  // Підпис відповіді
  const { data: merchant } = await supabase.rpc('wfp_merchant');
  const time = Math.floor(Date.now() / 1000);
  const { data: signature } = await supabase.rpc('wfp_sign', {
    p_data: [merchant, orderReference, 'accept', String(time)].join(';'),
  });

  return res.status(200).json({ orderReference, status: 'accept', time, signature });
}
