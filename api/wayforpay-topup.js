import crypto from 'node:crypto';

/**
 * Створення платежу WayForPay для поповнення ІГРОВОГО балансу (монети).
 * Пакети фіксовані на сервері — клієнт не може підмінити суму/кількість монет.
 * orderReference кодує playerId та кількість монет, щоб callback нарахував їх.
 */
const ACCOUNT = process.env.WFP_MERCHANT_ACCOUNT || 'freelance_user_69089df759268';
const SECRET = process.env.WFP_MERCHANT_SECRET;
const DOMAIN = process.env.WFP_DOMAIN || 'playheal.vercel.app';

const PACKAGES = {
  p1:   { amount: 1,   coins: 1 },
  p50:  { amount: 50,  coins: 250 },
  p100: { amount: 100, coins: 500 },
  p200: { amount: 200, coins: 1100 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const pkg = PACKAGES[body.packageId];
  if (!pkg) {
    res.status(400).json({ error: 'Невідомий пакет поповнення.' });
    return;
  }
  const playerId = String(body.playerId || '');
  if (!/^[0-9a-fA-F-]{8,64}$/.test(playerId)) {
    res.status(400).json({ error: 'Невірний ідентифікатор гравця.' });
    return;
  }

  const amountStr = String(pkg.amount);
  const orderReference = `TOP_${playerId}_${pkg.coins}_${Date.now()}`;
  const orderDate = Math.floor(Date.now() / 1000);
  const currency = 'UAH';
  const productName = [`${pkg.coins} ігрових монет`];
  const productCount = [1];
  const productPrice = [pkg.amount];

  const signSource = [
    ACCOUNT,
    DOMAIN,
    orderReference,
    String(orderDate),
    amountStr,
    currency,
    ...productName,
    ...productCount.map(String),
    ...productPrice.map(String),
  ].join(';');
  const merchantSignature = crypto.createHmac('md5', SECRET).update(signSource, 'utf8').digest('hex');

  const origin = `https://${DOMAIN}`;
  const fields = {
    merchantAccount: ACCOUNT,
    merchantDomainName: DOMAIN,
    merchantSignature,
    orderReference,
    orderDate,
    amount: amountStr,
    currency,
    productName,
    productCount,
    productPrice,
    language: 'UA',
    returnUrl: `${origin}/api/wayforpay-return?to=topup`,
    serviceUrl: `${origin}/api/wayforpay-topup-callback`,
  };

  res.status(200).json({ action: 'https://secure.wayforpay.com/pay', fields });
}
