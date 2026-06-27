// Вільні віконця Володимира з Google-таблиці (read-only).
// Таблиця опублікована як CSV; колонки = 5 тижнів × 7 днів (пн–нд),
// рядки = часові слоти (8:00–18:00), TRUE = вільно, FALSE = зайнято.
// Дати колонок поки невідомі (треба якір 1-го тижня), тож повертаємо
// орієнтовний тижневий розклад за 1-м тижнем (колонки 1–7).

const SHEET_ID = '1EzG_O-ZN9dM-LaZVHnKoN9C3FFUpWOvFUPrUad7DnKA';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

const DAYS_UK = ['Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота', 'Неділя'];

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

export default async function handler(req, res) {
  try {
    const r = await fetch(CSV_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return res.status(502).json({ error: 'sheet fetch failed', status: r.status });
    const rows = parseCsv(await r.text());

    // Рядки слотів: перша клітинка схожа на час "8:00".
    const slotRows = rows.filter((row) => /^\d{1,2}:\d{2}$/.test(row[0] || ''));

    // 1-й тиждень = колонки 1..7 → тижневий шаблон вільних годин по днях тижня.
    // template[weekdayIndex 0=Пн..6=Нд] = масив вільних годин.
    const template = DAYS_UK.map((_, di) => {
      const col = 1 + di;
      return slotRows
        .filter((row) => String(row[col]).toUpperCase() === 'TRUE')
        .map((row) => row[0]);
    });

    // Проектуємо шаблон на наступні N днів з реальними датами (Europe/Kyiv).
    const DAYS_AHEAD = 14;
    const SHORT_UK = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']; // за getDay() 0=Нд
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }));
    const upcoming = [];
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const jsDow = d.getDay();                 // 0=Нд..6=Сб
      const tplIdx = (jsDow + 6) % 7;           // → 0=Пн..6=Нд
      const times = template[tplIdx];
      if (!times.length) continue;              // вихідний/повністю зайнятий — пропускаємо
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      upcoming.push({
        date: `${d.getFullYear()}-${mm}-${dd}`,
        label: `${SHORT_UK[jsDow]}, ${dd}.${mm}`,
        times,
      });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ upcoming, note: 'tyzhnevyi shablon sproektovano na 14 dniv' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
