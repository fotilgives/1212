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

    // 1-й тиждень = колонки 1..7. Для кожного дня збираємо вільні години.
    const days = DAYS_UK.map((label, di) => {
      const col = 1 + di; // зсув на колонку часу
      const times = slotRows
        .filter((row) => String(row[col]).toUpperCase() === 'TRUE')
        .map((row) => row[0]);
      return { day: label, times };
    });

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ days, note: 'orientovnyi tyzhnevyi rozklad (1-y tyzhden)' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
