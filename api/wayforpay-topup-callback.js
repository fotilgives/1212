const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI5ODcsImV4cCI6MjA5MTA0ODk4N30.VjWnmvh8tw1GSIBJYWbJ8o5dYBkCj5pOUj2zoTPHmyg';

async function rpc(fn, args = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`rpc ${fn}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

const s = (v) => (v == null ? '' : String(v));

export default async function handler(req, res) {
  const time = Math.floor(Date.now() / 1000);
  let orderReference = '';

  try {
    let body = req.body;
    const ct = (req.headers['content-type'] || '').toLowerCase();

    if (typeof body === 'string') {
      if (ct.includes('urlencoded')) {
        body = Object.fromEntries(new URLSearchParams(body));
      } else {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
    }
    body = body || {};
    orderReference = s(body.orderReference);

    const {
      merchantAccount, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode, merchantSignature,
    } = body;

    // Build signature string — convert ALL fields to string (undefined → '')
    const inSigStr = [
      s(merchantAccount), orderReference, s(amount), s(currency),
      s(authCode), s(cardPan), s(transactionStatus), s(reasonCode),
    ].join(';');

    console.log('[wfp-cb] ct:', ct, 'status:', s(transactionStatus), 'ref:', orderReference);
    console.log('[wfp-cb] sigStr:', inSigStr);

    let sigValid = false;
    try {
      const expected = await rpc('wfp_sign', { p_data: inSigStr });
      sigValid = !!expected && expected === merchantSignature;
      console.log('[wfp-cb] sigValid:', sigValid, 'expected:', expected, 'received:', merchantSignature);
    } catch (sigErr) {
      console.error('[wfp-cb] wfp_sign error:', sigErr.message);
    }

    if (sigValid && s(transactionStatus) === 'Approved') {
      const parts    = orderReference.split('_');
      const playerId = parts[1];
      const coins    = parseInt(parts[2], 10);
      console.log('[wfp-cb] crediting player:', playerId, 'coins:', coins);
      if (playerId && Number.isFinite(coins) && coins > 0) {
        try {
          await rpc('rps_topup', { p_id: playerId, p_nick: 'Гравець', p_amount: coins });
          console.log('[wfp-cb] topup OK');
        } catch (topupErr) {
          console.error('[wfp-cb] topup error:', topupErr.message);
        }
      } else {
        console.log('[wfp-cb] bad playerId/coins — skip');
      }
    } else {
      console.log('[wfp-cb] not crediting — sigValid:', sigValid, 'status:', s(transactionStatus));
    }

    // Build accept response signature
    let respSig = '';
    try {
      const merchant = await rpc('wfp_merchant');
      respSig = await rpc('wfp_sign', {
        p_data: [s(merchant) || s(merchantAccount), orderReference, 'accept', String(time)].join(';'),
      });
    } catch (e) {
      console.error('[wfp-cb] respSig error:', e.message);
    }

    return res.status(200).json({ orderReference, status: 'accept', time, signature: respSig || '' });
  } catch (err) {
    console.error('[wfp-cb] FATAL:', err.message);
    return res.status(200).json({ orderReference, status: 'accept', time, signature: '' });
  }
}
