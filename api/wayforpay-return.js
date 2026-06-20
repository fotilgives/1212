/**
 * returnUrl — куди WayForPay повертає користувача після оплати.
 */
export default function handler(req, res) {
  let to = '';
  try {
    to = new URL(req.url, 'http://localhost').searchParams.get('to') || '';
  } catch { to = ''; }

  // Кількість монет для показу на сторінці
  const coins = to === 'topup' ? (req.body?.productPrice?.[0] ?? '') : '';
  const target = to === 'topup' ? `/?wfp=ok` : '/?donate=thanks';
  res.writeHead(302, { Location: target });
  res.end();
}
