import { rpc, s } from './_wfp.js';

/**
 * Створення платежу WayForPay за онлайн-курс йоги (фіксована ціна).
 * Контакти покупця (email/телефон/імʼя) передаються у WayForPay — він надсилає
 * квитанцію на пошту, а в кабінеті мерчанта видно замовлення з контактами.
 */
const COURSE_PRICE = 2500;
const COURSE_NAME = 'Курс з йоги (онлайн)';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const name = s(body.name).slice(0, 60);
    const email = s(body.email).slice(0, 80);
    const phone = s(body.phone).replace(/[^\d+]/g, '').slice(0, 20);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Вкажіть коректний e-mail для доступу до курсу.' });
    }
    if (phone.replace(/\D/g, '').length < 9) {
      return res.status(400).json({ error: 'Вкажіть коректний номер телефону.' });
    }

    const orderRef = `COURSE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const orderDate = Math.floor(Date.now() / 1000);
    const currency = 'UAH';

    const [merchant, domain] = await Promise.all([rpc('wfp_merchant'), rpc('wfp_domain')]);
    if (!merchant || !domain) return res.status(500).json({ error: 'Не вдалося отримати конфіг.' });

    const sigStr = [
      merchant, domain, orderRef, String(orderDate),
      String(COURSE_PRICE), currency, COURSE_NAME, '1', String(COURSE_PRICE),
    ].join(';');
    const signature = await rpc('wfp_sign', { p_data: sigStr });
    if (!signature) return res.status(500).json({ error: 'Не вдалося згенерувати підпис.' });

    const origin = `https://${domain}`;
    const fields = {
      merchantAccount: merchant,
      merchantDomainName: domain,
      merchantSignature: signature,
      orderReference: orderRef,
      orderDate: String(orderDate),
      amount: String(COURSE_PRICE),
      currency,
      productName: [COURSE_NAME],
      productCount: ['1'],
      productPrice: [String(COURSE_PRICE)],
      language: 'UA',
      returnUrl: `${origin}/api/wayforpay-return?to=course`,
      serviceUrl: `${origin}/api/wayforpay-callback`,
    };
    if (name) fields.clientFirstName = name;
    if (email) fields.clientEmail = email;
    if (phone) fields.clientPhone = phone;

    return res.status(200).json({ action: 'https://secure.wayforpay.com/pay', fields });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: `[DEBUG] ${msg}` });
  }
}
