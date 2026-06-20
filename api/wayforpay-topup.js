import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI5ODcsImV4cCI6MjA5MTA0ODk4N30.VjWnmvh8tw1GSIBJYWbJ8o5dYBkCj5pOUj2zoTPHmyg';

const PACKAGES = {
  p1:   { amount: 1,   coins: 1 },
  p50:  { amount: 50,  coins: 250 },
  p100: { amount: 100, coins: 500 },
  p200: { amount: 200, coins: 1100 },
};

export default async function handler(req, res) {
  // Завжди повертаємо JSON, ніколи не кидаємо HTML
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const pkg = PACKAGES[body.packageId];
    if (!pkg) return res.status(400).json({ error: 'Невідомий пакет поповнення.' });

    const playerId = String(body.playerId || '');
    if (!playerId || playerId.length < 8) {
      return res.status(400).json({ error: 'Невірний ідентифікатор гравця.' });
    }

    const supabase  = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const orderRef  = `TOP_${playerId}_${pkg.coins}_${Date.now()}`;
    const orderDate = Math.floor(Date.now() / 1000);
    const productName = `${pkg.coins} ігрових монет`;
    const currency  = 'UAH';

    // Отримуємо merchant/domain/підпис з Postgres (секрет ніколи не залишає БД)
    const [mRes, dRes] = await Promise.all([
      supabase.rpc('wfp_merchant'),
      supabase.rpc('wfp_domain'),
    ]);

    const merchant = mRes.data;
    const domain   = dRes.data;

    if (!merchant || !domain) {
      return res.status(500).json({ error: 'Платіжний сервіс тимчасово недоступний (config).' });
    }

    const sigStr = [
      merchant, domain, orderRef, String(orderDate),
      String(pkg.amount), currency, productName, '1', String(pkg.amount),
    ].join(';');

    const { data: signature, error: sigErr } = await supabase.rpc('wfp_sign', { p_data: sigStr });
    if (sigErr || !signature) {
      return res.status(500).json({ error: 'Платіжний сервіс тимчасово недоступний (sign).' });
    }

    const origin = `https://${domain}`;
    return res.status(200).json({
      action: 'https://secure.wayforpay.com/pay',
      fields: {
        merchantAccount:    merchant,
        merchantDomainName: domain,
        merchantSignature:  signature,
        orderReference:     orderRef,
        orderDate:          String(orderDate),
        amount:             String(pkg.amount),
        currency,
        productName:        [productName],
        productCount:       ['1'],
        productPrice:       [String(pkg.amount)],
        language:           'UA',
        returnUrl:          `${origin}/api/wayforpay-return?to=topup`,
        serviceUrl:         `${origin}/api/wayforpay-topup-callback`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `[DEBUG] ${msg}` });
  }
}
