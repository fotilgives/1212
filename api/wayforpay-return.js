import { parseBody, confirmAndCredit, checkStatus, rpc, s } from './_wfp.js';

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

  if (to === 'course') {
    // Якщо оплату курсу підтверджено — скидаємо таймер «таяння» гравцю
    // (playerId зашитий у orderReference: COURSE_<playerId>_<ts>).
    try {
      const body = await parseBody(req);
      const ref = s(body.orderReference);
      const pid = ref.split('_')[1] || '';
      if (ref.startsWith('COURSE_') && /^[0-9a-fA-F-]{8,40}$/.test(pid) && pid !== 'anon') {
        const st = await checkStatus(ref);
        if (st && st.status === 'Approved') {
          await rpc('rps_touch_activity', { p_id: pid });
        }
      }
    } catch (e) {
      console.error('[wfp-return course] ERR:', e.message);
    }
    // Після оплати ведемо людину одразу в Telegram-бот курсу (видає доступ/відео).
    res.writeHead(302, { Location: 'https://t.me/Kurs_Yoga_anatomihni_poizda_bot' });
    res.end();
    return;
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
