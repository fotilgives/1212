// Спільне джерело вільних віконець Володимира (сайт + телеграм-бот беруть звідси).
// Таблиця опублікована як CSV; колонки = 5 тижнів × 7 днів (пн–нд),
// рядки = часові слоти (8:00–18:00), TRUE = вільно, FALSE = зайнято.
// Дати колонок невідомі, тож 1-й тиждень = тижневий шаблон, який проектуємо
// на найближчі дні з реальними датами (Europe/Kyiv).

const SHEET_ID = '1EzG_O-ZN9dM-LaZVHnKoN9C3FFUpWOvFUPrUad7DnKA';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
const DAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];
const SHORT_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']; // за getDay() 0=Нд

// Мінімальний парсер CSV (значення в лапках, кома-роздільник, без переносів усередині).
function parseCsv(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const cells = [];
      const re = /"([^"]*)"|([^,]+)|(?<=,)(?=,)|^(?=,)/g;
      let m;
      while ((m = re.exec(line)) !== null) {
        cells.push((m[1] ?? m[2] ?? '').trim());
        if (re.lastIndex === 0) re.lastIndex++;
      }
      return cells;
    });
}

// Повертає масив найближчих днів з вільними годинами:
//   [{ date:'2026-06-29', label:'Пн, 29.06', times:['8:00','9:00',...] }, ...]
export async function getUpcomingSlots(daysAhead = 14) {
  const r = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`sheet fetch failed: ${r.status}`);
  const rows = parseCsv(await r.text());
  const slotRows = rows.filter((row) => /^\d{1,2}:\d{2}$/.test(row[0] || ''));

  // 1-й тиждень = колонки 1..7 → шаблон вільних годин по днях тижня (0=Пн..6=Нд).
  const template = DAYS_UK.map((_, di) => {
    const col = 1 + di;
    return slotRows
      .filter((row) => String(row[col]).toUpperCase() === 'TRUE')
      .map((row) => row[0]);
  });

  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }));
  const upcoming = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const jsDow = d.getDay();
    const tplIdx = (jsDow + 6) % 7;
    const times = template[tplIdx];
    if (!times.length) continue;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    upcoming.push({ date: `${d.getFullYear()}-${mm}-${dd}`, label: `${SHORT_UK[jsDow]}, ${dd}.${mm}`, times });
  }
  return upcoming;
}
