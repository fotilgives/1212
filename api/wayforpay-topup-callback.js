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

async function readRawBody(req) {
  // Try req.body first (Vercel may auto-parse JSON)
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString('utf-8');
    if (typeof req.body === 'object') return req.body; // already parsed
  }
  // Read stream with for-await (works in Node 18+)
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req, res) {
  const time = Math.floor(Date.now() / 1000);
  let orderReference = '';

  try {
    const ct = (req.headers['content-type'] || '').toLowerCase();
    const raw = await readRawBody(req);

    console.log('[wfp-cb] ct:', ct, 'rawType:', typeof raw, 'rawLen:', typeof raw === 'string' ? raw.length : JSON.stringify(raw).length);

    let body = {};
    if (typeof raw === 'object') {
      body = raw;
    } else if (typeof raw === 'string' && raw.length > 0) {
      if (ct.includes('urlencoded')) {
        body = Object.fromEntries(new URLSearchParams(raw));
      } else {
        try { body = JSON.parse(raw); } catch { body = {}; }
      }
    }

    const s = (v) => (v == null ? '' : String(v));
    const {
      merchantAccount, orderReference: ref, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode, merchantSignature,
    } = body;

    orderReference = s(ref);

    console.log('[wfp-cb] status:', s(transactionStatus), 'ref:', orderReference, 'amount:', s(amount));
    console.log('[wfp-cb] keys:', Object.keys(body).join(','));

    const parts      = orderReference.split('_');
    const playerId   = parts[1] || '';
    const coins      = parseInt(parts[2], 10);
    const orderValid = parts[0] === 'TOP' && playerId.length >= 8 && coins > 0;

    if (s(transactionStatus) === 'Approved' && orderValid) {
      console.log('[wfp-cb] crediting', playerId, coins);
      try {
        const bal = await rpc('rps_topup', { p_id: playerId, p_nick: 'Гравець', p_amount: coins });
        console.log('[wfp-cb] TOPUP OK bal:', bal);
      } catch (e) {
        console.error('[wfp-cb] topup ERR:', e.message);
      }
    } else {
      console.log('[wfp-cb] skip — status:', s(transactionStatus), 'orderValid:', orderValid);
    }

    let respSig = '';
    try {
      const merchant = await rpc('wfp_merchant');
      respSig = await rpc('wfp_sign', {
        p_data: [s(merchant) || s(merchantAccount), orderReference, 'accept', String(time)].join(';'),
      });
    } catch (e) {
      console.error('[wfp-cb] respSig ERR:', e.message);
    }

    return res.status(200).json({ orderReference, status: 'accept', time, signature: respSig || '' });
  } catch (err) {
    console.error('[wfp-cb] FATAL:', err.message);
    return res.status(200).json({ orderReference, status: 'accept', time, signature: '' });
  }
}
