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

// Read raw body from stream (handles Buffer, string, object, undefined)
async function parseBody(req) {
  const ct = (req.headers['content-type'] || '').toLowerCase();

  // If Vercel already parsed it to a plain object (JSON)
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  // Read raw bytes from stream
  const raw = await new Promise((resolve, reject) => {
    // Already a string or Buffer sitting on req.body
    if (typeof req.body === 'string') return resolve(req.body);
    if (Buffer.isBuffer(req.body)) return resolve(req.body.toString('utf-8'));

    // Stream
    const chunks = [];
    req.on('data', (c) => chunks.push(typeof c === 'string' ? Buffer.from(c) : c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });

  if (!raw) return {};

  if (ct.includes('urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async function handler(req, res) {
  const time = Math.floor(Date.now() / 1000);
  let orderReference = '';

  try {
    const body = await parseBody(req);

    const {
      merchantAccount, orderReference: ref, amount, currency,
      authCode, cardPan, transactionStatus, reasonCode, merchantSignature,
    } = body;

    orderReference = String(ref || '');
    const s = (v) => (v == null ? '' : String(v));

    console.log('[wfp-cb] status:', s(transactionStatus), 'ref:', orderReference, 'amount:', s(amount));
    console.log('[wfp-cb] bodyKeys:', Object.keys(body).join(','));

    // Перевіряємо тільки статус та формат orderReference (TOP_uuid_coins_ts)
    const parts = orderReference.split('_');
    const playerId = parts[1] || '';
    const coins    = parseInt(parts[2], 10);
    const orderValid = parts[0] === 'TOP' && playerId.length >= 8 && coins > 0;

    console.log('[wfp-cb] orderValid:', orderValid, 'playerId:', playerId, 'coins:', coins);

    if (s(transactionStatus) === 'Approved' && orderValid) {
      try {
        const bal = await rpc('rps_topup', { p_id: playerId, p_nick: 'Гравець', p_amount: coins });
        console.log('[wfp-cb] TOPUP OK bal:', bal);
      } catch (e) {
        console.error('[wfp-cb] topup ERR:', e.message);
      }
    } else {
      console.log('[wfp-cb] skip — status:', s(transactionStatus), 'orderValid:', orderValid);
    }

    // Відповідь для WayForPay
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
