/**
 * returnUrl — куди WayForPay повертає користувача після оплати.
 * WayForPay може зробити POST; ми приймаємо будь-який метод і робимо
 * чистий redirect (GET) на сторінку подяки в SPA.
 */
export default function handler(req, res) {
  res.writeHead(302, { Location: '/?donate=thanks' });
  res.end();
}
