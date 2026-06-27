import React, { useEffect, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';

interface DaySlots {
  date: string;
  label: string;
  times: string[];
}

// Read-only панель вільних віконець Володимира (з Google-таблиці через /api/free-slots).
// Тижневий шаблон спроектовано на найближчі дні з реальними датами.
const FreeSlots: React.FC = () => {
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/free-slots')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => alive && setDays(d.upcoming || []))
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, []);

  if (err) return null; // тихо ховаємо панель, форма працює без неї

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
        <CalendarClock className="h-4 w-4" /> Вільні віконця Володимира
      </div>
      <p className="mt-0.5 text-[11px] text-emerald-700/80">
        Найближчі вільні дати — точний час узгодимо при дзвінку.
      </p>

      {!days ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
          {days.map((d) => (
            <div key={d.date} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="w-20 shrink-0 text-xs font-semibold text-slate-600">{d.label}</span>
              <span className="flex flex-wrap gap-1">
                {d.times.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreeSlots;
