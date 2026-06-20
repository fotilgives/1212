import { parseBody, s, parseTopupRef, creditTopup, buildAcceptResponse } from './_wfp.js';

/**
 * serviceUrl поповнення монет — WayForPay шле сюди статус транзакції (server-to-server).
 * Зараховуємо монети ідемпотентно та завжди відповідаємо валідним accept-підписом,
 * щоб WayForPay не повторював запити нескінченно.
 */
export default async function handler(req, res) {
  let orderReference = '';
  let merchantAccount = '';
  try {
    const body = await parseBody(req);
    orderReference = s(body.orderReference);
    merchantAccount = s(body.merchantAccount);
    const transactionStatus = s(body.transactionStatus);
    const amount = parseInt(s(body.amount), 10);

    const { valid, coins, playerId } = parseTopupRef(orderReference);
    console.log('[wfp-cb] status:', transactionStatus, 'ref:', orderReference, 'valid:', valid);

    if (transactionStatus === 'Approved' && valid) {
      await creditTopup(orderReference, coins, Number.isFinite(amount) ? amount : null, 'callback');
    } else {
      console.log('[wfp-cb] skip — status:', transactionStatus, 'valid:', valid, 'player:', playerId);
    }

    const resp = await buildAcceptResponse(orderReference, merchantAccount);
    return res.status(200).json(resp);
  } catch (err) {
    console.error('[wfp-cb] FATAL:', err.message);
    const time = Math.floor(Date.now() / 1000);
    return res.status(200).json({ orderReference, status: 'accept', time, signature: '' });
  }
}
