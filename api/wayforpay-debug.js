import { rpc, s, transactionList, checkStatus, parseTopupRef } from './_wfp.js';

/**
 * Потужний діагностичний ендпоінт WayForPay.
 *
 * Прогорнає всю систему оплати крок за кроком і повертає детальний звіт:
 * конфіг, перевірку підпису, виклик TRANSACTION_LIST та CHECK_STATUS, останні
 * зараховані замовлення. КОЖЕН крок ловить свою помилку окремо й пише її в звіт,
 * тож одного GET-запиту достатньо, щоб побачити, що саме зламано.
 *
 * Виклик: GET /api/wayforpay-debug                — загальна діагностика
 *         GET /api/wayforpay-debug?ref=TOP_..._.. — + CHECK_STATUS конкретного замовлення
 *         GET /api/wayforpay-debug?player=<uuid>  — + замовлення цього гравця у WayForPay
 *
 * Секрет НЕ розкривається (лише факт наявності). Видалити після діагностики.
 */
export default async function handler(req, res) {
  const report = { ok: true, ts: new Date().toISOString(), steps: {} };
  const step = async (name, fn) => {
    try {
      report.steps[name] = await fn();
    } catch (e) {
      report.ok = false;
      report.steps[name] = { error: e instanceof Error ? e.message : String(e) };
    }
  };

  let ref = '';
  let player = '';
  try {
    const u = new URL(req.url, 'http://localhost');
    ref = s(u.searchParams.get('ref'));
    player = s(u.searchParams.get('player'));
  } catch {
    /* ignore */
  }

  // 1) Конфіг із Supabase (app_config через RPC)
  await step('config', async () => {
    const [merchant, domain] = await Promise.all([rpc('wfp_merchant'), rpc('wfp_domain')]);
    return {
      merchant: s(merchant),
      domain: s(domain),
      serviceUrl: `https://${s(domain)}/api/wayforpay-topup-callback`,
      returnUrl: `https://${s(domain)}/api/wayforpay-return?to=topup`,
    };
  });

  // 2) Підпис (HMAC-MD5 через pgcrypto): перевіряємо, що секрет на місці й підпис рахується
  await step('signature', async () => {
    const sig = await rpc('wfp_sign', { p_data: 'a;b;c' });
    return {
      sample_input: 'a;b;c',
      sample_signature: s(sig),
      secret_present: !!s(sig) && s(sig) !== 'd41d8cd98f00b204e9800998ecf8427e',
    };
  });

  // 3) TRANSACTION_LIST за 35 днів — перевіряємо доступ до API WayForPay і підпис рівня акаунта
  await step('transaction_list', async () => {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 35 * 24 * 3600;
    const list = await transactionList(from, now);
    const sample = list.slice(0, 12).map((t) => ({
      orderReference: s(t.orderReference),
      status: s(t.transactionStatus),
      amount: t.amount,
      currency: s(t.currency),
      reasonCode: s(t.reasonCode),
      createdDate: t.createdDate,
    }));
    return { count: list.length, sample };
  });

  // 4) CHECK_STATUS конкретного замовлення (якщо передано ?ref=)
  if (ref) {
    await step('check_status', async () => {
      const st = await checkStatus(ref);
      return { ref, parsed: parseTopupRef(ref), result: st };
    });
  }

  // 5) Замовлення конкретного гравця серед транзакцій WayForPay (якщо передано ?player=)
  if (player) {
    await step('player_orders', async () => {
      const now = Math.floor(Date.now() / 1000);
      const from = now - 35 * 24 * 3600;
      const list = await transactionList(from, now);
      const prefix = `TOP_${player}_`;
      const mine = list
        .filter((t) => s(t.orderReference).startsWith(prefix))
        .map((t) => ({
          orderReference: s(t.orderReference),
          status: s(t.transactionStatus),
          amount: t.amount,
          coins: parseTopupRef(s(t.orderReference)).coins,
        }));
      return { player, found: mine.length, orders: mine };
    });
  }

  // 5b) СИРІ відповіді API WayForPay (щоб бачити точну причину/reasonCode)
  await step('raw_transaction_list', async () => {
    const merchant = await rpc('wfp_merchant');
    const now = Math.floor(Date.now() / 1000);
    const from = now - 35 * 24 * 3600;
    const sig = await rpc('wfp_sign', { p_data: [s(merchant), String(from), String(now)].join(';') });
    const r = await fetch('https://api.wayforpay.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionType: 'TRANSACTION_LIST', merchantAccount: merchant, merchantSignature: sig, apiVersion: 1, dateBegin: from, dateEnd: now }),
    });
    const data = await r.json();
    return { reason: s(data.reason), reasonCode: s(data.reasonCode), count: Array.isArray(data.transactionList) ? data.transactionList.length : 'n/a' };
  });

  if (ref) {
    await step('raw_check_status', async () => {
      const merchant = await rpc('wfp_merchant');
      const sig = await rpc('wfp_sign', { p_data: [s(merchant), s(ref)].join(';') });
      const r = await fetch('https://api.wayforpay.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionType: 'CHECK_STATUS', merchantAccount: merchant, orderReference: s(ref), merchantSignature: sig, apiVersion: 1 }),
      });
      return await r.json();
    });
  }

  // 6) Останні зараховані замовлення з нашої БД
  await step('credited_orders', async () => {
    const rows = await rpc('rps_wfp_recent', { p_limit: 10 });
    return rows;
  });

  res.status(200).json(report);
}
