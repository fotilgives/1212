// Вільні віконця Володимира — HTTP-ендпоінт для сайту.
// Логіка спільна з телеграм-ботом (див. api/_slots.js).
import { getUpcomingSlots } from './_slots.js';

export default async function handler(req, res) {
  try {
    const upcoming = await getUpcomingSlots(14);
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ upcoming, note: 'tyzhnevyi shablon sproektovano na 14 dniv' });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
