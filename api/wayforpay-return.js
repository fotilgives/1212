import { parseBody, confirmAndCredit } from './_wfp.js';

/**
 * returnUrl — куди WayForPay повертає користувача (POST) після оплати.
 *
 * Для поповнення монет це ще й ЗАПАСНИЙ шлях зарахування: навіть якщо
 * server-to-server колбек (serviceUrl) не спрацював, ми тут підтверджуємо
 * оплату напряму в WayForPay (CHECK_STATUS) і зараховуємо монети ідемпотентно.
 */
export default async function handler(req, res) {
  let to = '';
  try {
    to = new URL(req.url, 'http://localhost').searchParams.get('to') || '';
  } catch {
    to = '';
  }

  if (to === 'topup') {
    try {
      const body = await parseBody(req);
      await confirmAndCredit(body, 'return');
    } catch (e) {
      console.error('[wfp-return] ERR:', e.message);
    }
    res.writeHead(302, { Location: '/?topup=thanks' });
    res.end();
    return;
  }

  res.writeHead(302, { Location: '/?donate=thanks' });
  res.end();
}
