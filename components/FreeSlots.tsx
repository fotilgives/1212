import React, { useEffect, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';

interface DaySlots {
  date: string;
  label: string;
  times: string[];
}

export interface PickedSlot {
  date: string;
  label: string;
  time: string;
}

interface Props {
  selected?: PickedSlot | null;
  onPick?: (slot: PickedSlot) => void;
}

// Панель вільних віконець Володимира (з Google-таблиці через /api/free-slots).
// Клік по годині обирає віконце. Тижневий шаблон спроектовано на найближчі дні.
const FreeSlots: React.FC<Props> = ({ selected, onPick }) => {
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
        Оберіть зручну годину — натисніть на віконце. Точний час підтвердимо при дзвінку.
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
                {d.times.map((t) => {
                  const isSel = selected?.date === d.date && selected?.time === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onPick?.({ date: d.date, label: d.label, time: t })}
                      className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 transition ${
                        isSel
                          ? 'bg-emerald-600 text-white ring-emerald-600'
                          : 'bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreeSlots;
