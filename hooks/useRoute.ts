import { useEffect, useState } from 'react';

export type Route = 'home' | 'game' | 'about' | 'services' | 'prizes' | 'philosophy';

const parse = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '');
  const r = h.split('?')[0] as Route;
  return (['home', 'game', 'about', 'services', 'prizes', 'philosophy'].includes(r) ? r : 'home') as Route;
};

export function navigate(to: Route) {
  window.location.hash = to === 'home' ? '/' : `/${to}`;
}

/**
 * Перехід на сторінку «Послуги» з автопрокруткою до форми запису.
 * Робить навігацію передбачуваною: кнопка «Записатися» завжди веде до форми.
 */
export function goToBooking() {
  try {
    sessionStorage.setItem('rps_scroll_book', '1');
  } catch {
    /* ignore */
  }
  if (parse() === 'services') {
    // Уже на сторінці — просто прокрутити до форми.
    const el = document.getElementById('book-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    navigate('services');
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onChange = () => {
      const next = parse();
      setRoute((prev) => {
        if (prev !== next) {
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
          }, 0);
        }
        return next;
      });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
