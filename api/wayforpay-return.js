import { parseBody, s, parseTopupRef, checkStatus, creditTopup } from './_wfp.js';

/**
 * returnUrl — куди WayForPay повертає користувача (POST) після оплати.
 *
 * Для поповнення монет це ще й ЗАПАСНИЙ шлях зарахування: навіть якщо
 * server-to-server колбек (serviceUrl) не спрацював, ми самі питаємо статус
 * транзакції в WayForPay (CHECK_STATUS) і зараховуємо монети ідемпотентно.
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
      const orderReference = s(body.orderReference);
      const { valid, coins } = parseTopupRef(orderReference);

      if (valid) {
        // Довіряємо лише статусу, отриманому напряму від WayForPay (не з браузера).
        const st = await checkStatus(orderReference);
        const browserStatus = s(body.transactionStatus);
        const approved =
          (st && st.status === 'Approved') ||
          // якщо CHECK_STATUS недоступний — підстраховка статусом із колбека браузера
          (!st && browserStatus === 'Approved');

        if (approved) {
          await creditTopup(orderReference, coins, null, 'return');
        } else {
          console.log('[wfp-return] not approved:', st ? st.status : browserStatus, orderReference);
        }
      }
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
