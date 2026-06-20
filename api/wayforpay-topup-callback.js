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
  if (!r.ok) throw new Error(`rpc ${fn}: ${await r.text()}`);
  return r.json();
}

export default async function handler(req, res) {
  try {
    let body = req.body;
    const contentType = (req.headers['content-type'] || '').toLowerCase();

    if (typeof body === 'string') {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        body = Object.fromEntries(new URLSearchParams(body));
      } else {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
    } else if (body && typeof body === 'object' && contentType.includes('application/x-www-form-urlencoded')) {
      // Vercel may already parse it into an object
    }
    body = body || {};

    console.log('[wfp-cb] content-type:', contentType);
    console.log('[wfp-cb] body keys:', Object.keys(body).join(','));
    console.log('[wfp-cb] transactionStatus:', body.transactionStatus, 'orderReference:', body.orderReference);

    const {
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode, merchantSignature,
    } = body;

    const inSigStr = [
      merchantAccount, orderReference, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode,
    ].join(';');

    const expected = await rpc('wfp_sign', { p_data: inSigStr });
    const valid = expected && expected === merchantSignature;

    console.log('[wfp-cb] sigValid:', valid, 'expected:', expected, 'got:', merchantSignature);

    if (valid && transactionStatus === 'Approved') {
      const parts    = String(orderReference || '').split('_');
      const playerId = parts[1];
      const coins    = parseInt(parts[2], 10);
      console.log('[wfp-cb] crediting playerId:', playerId, 'coins:', coins);
      if (playerId && Number.isFinite(coins) && coins > 0) {
        await rpc('rps_topup', { p_id: playerId, p_nick: 'Гравець', p_amount: coins });
        console.log('[wfp-cb] topup done');
      } else {
        console.log('[wfp-cb] skip topup - invalid playerId or coins');
      }
    } else {
      console.log('[wfp-cb] skip topup - valid:', valid, 'status:', transactionStatus);
    }

    const merchant = await rpc('wfp_merchant');
    const time     = Math.floor(Date.now() / 1000);
    const signature = await rpc('wfp_sign', {
      p_data: [merchant || merchantAccount, orderReference, 'accept', String(time)].join(';'),
    });

    return res.status(200).json({ orderReference: orderReference || '', status: 'accept', time, signature: signature || '' });
  } catch (err) {
    return res.status(200).json({
      orderReference: (req.body || {}).orderReference || '',
      status: 'accept',
      time:   Math.floor(Date.now() / 1000),
      signature: '',
    });
  }
}
