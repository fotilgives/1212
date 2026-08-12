import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Target container 'root' not found");
}

// Старі версії помилково реєстрували адмінський service worker на весь домен.
// На публічних сторінках прибираємо цю реєстрацію, щоб Android відкривав сайт
// як звичайну вебсторінку без PWA splash-екрана.
if ('serviceWorker' in navigator && window.location.pathname !== '/admin') {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations
      .filter((registration) => new URL(registration.scope).pathname === '/')
      .forEach((registration) => registration.unregister());
  }).catch(() => {});
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
