// Спільна логіка WayForPay для серверних функцій (Vercel).
// Файли з префіксом "_" у каталозі /api НЕ стають окремими ендпоінтами.

const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI5ODcsImV4cCI6MjA5MTA0ODk4N30.VjWnmvh8tw1GSIBJYWbJ8o5dYBkCj5pOUj2zoTPHmyg';

export async function rpc(fn, args = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`rpc ${fn}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const s = (v) => (v == null ? '' : String(v));

// Зчитування тіла запиту: Vercel може віддати req.body (об'єкт/рядок) або потік.
export async function readRawBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString('utf-8');
    if (typeof req.body === 'object') return req.body; // вже розпарсено
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Парсимо тіло у звичайний об'єкт незалежно від формату (JSON / urlencoded / об'єкт).
export async function parseBody(req) {
  const ct = (req.headers['content-type'] || '').toLowerCase();
  const raw = await readRawBody(req);
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw === 'string' && raw.length > 0) {
    if (ct.includes('urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
    try {
      return JSON.parse(raw);
    } catch {
      // WayForPay інколи шле JSON всередині form-поля — пробуємо ще раз як urlencoded
      try {
        return Object.fromEntries(new URLSearchParams(raw));
      } catch {
        return {};
      }
    }
  }
  return {};
}

// orderReference має формат TOP_<playerId(uuid)>_<coins>_<timestamp>.
export function parseTopupRef(orderReference) {
  const parts = s(orderReference).split('_');
  const playerId = parts[1] || '';
  const coins = parseInt(parts[2], 10);
  const valid = parts[0] === 'TOP' && playerId.length >= 8 && Number.isFinite(coins) && coins > 0;
  return { playerId, coins, valid };
}

// Підпис відповіді для serviceUrl: merchantAccount;orderReference;status;time
export async function buildAcceptResponse(orderReference, merchantAccount) {
  const time = Math.floor(Date.now() / 1000);
  let signature = '';
  try {
    const merchant = (await rpc('wfp_merchant')) || merchantAccount;
    signature = await rpc('wfp_sign', {
      p_data: [s(merchant), s(orderReference), 'accept', String(time)].join(';'),
    });
  } catch (e) {
    console.error('[wfp] accept-sign ERR:', e.message);
  }
  return { orderReference: s(orderReference), status: 'accept', time, signature: signature || '' };
}

/**
 * Надійна перевірка статусу транзакції безпосередньо через API WayForPay
 * (CHECK_STATUS). Не залежить від даних із браузера — сервер питає WayForPay сам.
 * Повертає { status, reasonCode } або null, якщо запит не вдався.
 */
export async function checkStatus(orderReference) {
  try {
    const merchant = await rpc('wfp_merchant');
    const signature = await rpc('wfp_sign', {
      p_data: [s(merchant), s(orderReference)].join(';'),
    });
    const r = await fetch('https://api.wayforpay.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionType: 'CHECK_STATUS',
        merchantAccount: merchant,
        orderReference: s(orderReference),
        merchantSignature: signature,
        apiVersion: 1,
      }),
    });
    const data = await r.json();
    return { status: s(data.transactionStatus), reasonCode: s(data.reasonCode) };
  } catch (e) {
    console.error('[wfp] checkStatus ERR:', e.message);
    return null;
  }
}

/**
 * Ідемпотентне зарахування монет за замовлення поповнення.
 * Повертає true, якщо зарахування пройшло (або вже було зараховано раніше).
 */
export async function creditTopup(orderReference, coinsHint, amountHint, source) {
  const { playerId, coins, valid } = parseTopupRef(orderReference);
  if (!valid) {
    console.log('[wfp] creditTopup: invalid ref', orderReference);
    return false;
  }
  const finalCoins = Number.isFinite(coinsHint) && coinsHint > 0 ? coinsHint : coins;
  try {
    const bal = await rpc('rps_wfp_credit', {
      p_order_ref: s(orderReference),
      p_player: playerId,
      p_coins: finalCoins,
      p_amount: Number.isFinite(amountHint) ? amountHint : null,
      p_source: source || null,
    });
    console.log('[wfp] credited', orderReference, '->', bal);
    return true;
  } catch (e) {
    console.error('[wfp] creditTopup ERR:', e.message);
    return false;
  }
}
