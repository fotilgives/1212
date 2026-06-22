import { rpc } from './_wfp.js';

const PACKAGES = {
  p1:   { amount: 1,   coins: 10000 }, // 🧪 Тест: 1 грн -> 10000 балів (для перевірки купівлі курсу/подарунків)
  p50:  { amount: 50,  coins: 250 },
  p100: { amount: 100, coins: 500 },
  p200: { amount: 200, coins: 1100 },
};

// Курс для довільної суми: 1 грн = 5 балів (як 100 грн = 500 балів).
const COIN_RATE = 5;
const CUSTOM_MIN_UAH = 1;
const CUSTOM_MAX_UAH = 100000;

// Пакет для оплати: або фіксований (packageId), або довільна сума (amount у грн).
function resolvePackage(body) {
  const custom = Number(body.amount);
  if (Number.isFinite(custom) && custom >= CUSTOM_MIN_UAH) {
    const amount = Math.floor(custom);
    if (amount > CUSTOM_MAX_UAH) return null;
    return { amount, coins: amount * COIN_RATE };
  }
  return PACKAGES[body.packageId] || null;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const pkg = resolvePackage(body);
    if (!pkg) return res.status(400).json({ error: 'Невірна сума поповнення.' });

    const playerId = String(body.playerId || '');
    if (!playerId || playerId.length < 8)
      return res.status(400).json({ error: 'Невірний ідентифікатор гравця.' });

    const orderRef    = `TOP_${playerId}_${pkg.coins}_${Date.now()}`;
    const orderDate   = Math.floor(Date.now() / 1000);
    const productName = `${pkg.coins} ігрових монет`;
    const currency    = 'UAH';

    const [merchant, domain] = await Promise.all([rpc('wfp_merchant'), rpc('wfp_domain')]);
    if (!merchant || !domain) return res.status(500).json({ error: 'Не вдалося отримати конфіг.' });

    const sigStr = [
      merchant, domain, orderRef, String(orderDate),
      String(pkg.amount), currency, productName, '1', String(pkg.amount),
    ].join(';');

    const signature = await rpc('wfp_sign', { p_data: sigStr });
    if (!signature) return res.status(500).json({ error: 'Не вдалося згенерувати підпис.' });

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
