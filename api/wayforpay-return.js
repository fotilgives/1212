/**
 * returnUrl — куди WayForPay повертає користувача після оплати.
 * WayForPay може зробити POST; приймаємо будь-який метод і робимо
 * чистий redirect (GET) на сторінку подяки в SPA.
 * ?to=topup -> подяка за поповнення монет, інакше -> подяка за донат.
 */
export default function handler(req, res) {
  let to = '';
  try {
    to = new URL(req.url, 'http://localhost').searchParams.get('to') || '';
  } catch {
    to = '';
  }
  const target = to === 'topup' ? '/?topup=thanks' : '/?donate=thanks';
  res.writeHead(302, { Location: target });
  res.end();
}
