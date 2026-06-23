// Спільна логіка WayForPay для серверних функцій (Vercel).
// Файли з префіксом "_" у каталозі /api НЕ стають окремими ендпоінтами.
import { buildTopupReceiptEmail, sendTransactionalEmail, normalizeOrigin } from './_mail.js';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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
const WFP_FIELDS = ['orderReference', 'merchantAccount', 'transactionStatus', 'merchantSignature'];

function looksLikeWfp(obj) {
  return obj && typeof obj === 'object' && WFP_FIELDS.some((k) => k in obj);
}

// WayForPay шле JSON-рядок із Content-Type: application/x-www-form-urlencoded,
// тож стандартні парсери віддають { '<увесь JSON>': '' }. Дістаємо справжній об'єкт.
function recoverWfpObject(obj) {
  if (looksLikeWfp(obj)) return obj;
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const t = String(k).trim();
      if (t.startsWith('{') && t.endsWith('}')) {
        try {
          const parsed = JSON.parse(t);
          if (looksLikeWfp(parsed)) return parsed;
        } catch {
          /* ignore */
        }
      }
    }
  }
  return obj || {};
}

export async function parseBody(req) {
  const raw = await readRawBody(req);

  // Vercel вже розпарсив тіло в об'єкт (можливо, у "кривому" вигляді WayForPay).
  if (raw && typeof raw === 'object') return recoverWfpObject(raw);

  if (typeof raw === 'string' && raw.length > 0) {
    const t = raw.trim();
    // 1) Чистий JSON (саме так шле WayForPay).
    if (t.startsWith('{')) {
      try {
        return JSON.parse(t);
      } catch {
        /* ignore */
      }
    }
    // 2) urlencoded — звичайний або з JSON у назві єдиного ключа.
    try {
      const params = Object.fromEntries(new URLSearchParams(raw));
      return recoverWfpObject(params);
    } catch {
      /* ignore */
    }
    // 3) Остання спроба — JSON без перевірки дужки.
    try {
      return JSON.parse(t);
    } catch {
      return {};
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
    console.log('[wfp] CHECK_STATUS resp:', JSON.stringify(data).slice(0, 500));
    // Якщо WayForPay не повернув статусу транзакції (помилка API/підпису) —
    // вважаємо результат непереконливим (null), щоб спрацював фолбек на статус із тіла.
    const status = s(data.transactionStatus);
    if (!status) {
      console.log('[wfp] checkStatus inconclusive:', s(data.reason), s(data.reasonCode));
      return null;
    }
    return { status, reasonCode: s(data.reasonCode) };
  } catch (e) {
    console.error('[wfp] checkStatus ERR:', e.message);
    return null;
  }
}

/**
 * Список транзакцій мерчанта за період через API WayForPay (TRANSACTION_LIST).
 * Підпис: merchantAccount;dateBegin;dateEnd. Повертає масив або [].
 */
export async function transactionList(fromTs, toTs) {
  try {
    const merchant = await rpc('wfp_merchant');
    const signature = await rpc('wfp_sign', {
      p_data: [s(merchant), String(fromTs), String(toTs)].join(';'),
    });
    const r = await fetch('https://api.wayforpay.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionType: 'TRANSACTION_LIST',
        merchantAccount: merchant,
        merchantSignature: signature,
        apiVersion: 1,
        dateBegin: fromTs,
        dateEnd: toTs,
      }),
    });
    const data = await r.json();
    console.log('[wfp] TRANSACTION_LIST reason:', s(data.reason), s(data.reasonCode), 'count:', Array.isArray(data.transactionList) ? data.transactionList.length : 'n/a');
    return Array.isArray(data.transactionList) ? data.transactionList : [];
  } catch (e) {
    console.error('[wfp] transactionList ERR:', e.message);
    return [];
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
    await sendTopupReceipt(orderReference, playerId, finalCoins, amountHint);
    return true;
  } catch (e) {
    console.error('[wfp] creditTopup ERR:', e.message);
    return false;
  }
}

// Лист-квитанція після зарахування монет. Шлеться лише раз (claim_email) і лише
// якщо у гравця є акаунт з поштою. Будь-яка помилка не зриває зарахування.
async function sendTopupReceipt(orderReference, playerId, coins, amountHint) {
  try {
    const email = s(await rpc('rps_player_email', { p_id: playerId }));
    if (!EMAIL_RE.test(email)) return;
    const claimed = await rpc('rps_wfp_claim_email', { p_order_ref: s(orderReference) });
    if (!claimed) return;
    const domain = await rpc('wfp_domain');
    const origin = normalizeOrigin(domain || process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const bannerUrl = origin ? `${origin}/images/email/welcome-banner.png` : '';
    const { subject, html, text } = buildTopupReceiptEmail({
      name: '',
      coins,
      amountUah: Number.isFinite(amountHint) ? amountHint : null,
      appUrl: origin,
      supportEmail: process.env.COURSE_SUPPORT_EMAIL || 'support@example.com',
      bannerUrl,
    });
    await sendTransactionalEmail({ to: email, subject, html, text });
    console.log('[wfp] topup receipt sent', orderReference, '->', email);
  } catch (e) {
    console.error('[wfp] topup receipt ERR:', e.message);
  }
}

// Перевірка підпису callback WayForPay:
// merchantAccount;orderReference;amount;currency;authCode;cardPan;transactionStatus;reasonCode
export async function verifyCallback(body) {
  try {
    const fields = ['merchantAccount', 'orderReference', 'amount', 'currency', 'authCode', 'cardPan', 'transactionStatus', 'reasonCode'];
    const data = fields.map((f) => s(body[f])).join(';');
    const expected = s(await rpc('wfp_sign', { p_data: data }));
    return !!expected && expected === s(body.merchantSignature);
  } catch (e) {
    console.error('[wfp] verifyCallback ERR:', e.message);
    return false;
  }
}

/**
 * Єдина точка прийняття рішення про зарахування — використовується і колбеком,
 * і returnUrl. Зараховує монети ТІЛЬКИ якщо WayForPay підтвердив оплату:
 *   1) CHECK_STATUS API повертає 'Approved' (істина, підробити неможливо), АБО
 *   2) CHECK_STATUS недоступний, АЛЕ тіло має статус 'Approved' з валідним підписом.
 * Зарахування ідемпотентне (одне замовлення — один раз).
 */
export async function confirmAndCredit(body, source) {
  const orderReference = s(body.orderReference);
  const { valid, coins } = parseTopupRef(orderReference);
  if (!valid) {
    console.log('[wfp] confirmAndCredit: invalid ref', orderReference, '(', source, ')');
    return false;
  }

  const st = await checkStatus(orderReference);
  let approved;
  if (st) {
    approved = st.status === 'Approved';
    console.log('[wfp] checkStatus', orderReference, '->', st.status);
  } else {
    approved = s(body.transactionStatus) === 'Approved' && (await verifyCallback(body));
    console.log('[wfp] checkStatus unreachable; signed-fallback approved:', approved);
  }

  if (!approved) return false;
  return creditTopup(orderReference, coins, null, source);
}
