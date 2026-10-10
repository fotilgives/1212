import { buildOwnerNotice, normalizeOrigin, sendTransactionalEmail } from './_mail.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase is not configured');
    let body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const token = String(body.token || '');
    const tournamentId = Number(body.tournamentId);
    if (!token || !Number.isInteger(tournamentId)) return res.status(400).json({ error: 'bad request' });

    const rpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/rps_admin_tournament_email_payload`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_token: token, p_tournament_id: tournamentId }),
    });
    if (!rpc.ok) throw new Error(`recipient lookup failed: ${rpc.status}`);
    const recipients = await rpc.json();
    const origin = normalizeOrigin(process.env.WFP_DOMAIN || process.env.VERCEL_URL || 'reabilitolog-play.vercel.app');
    const link = `${origin || 'https://reabilitolog-play.vercel.app'}/?tournament=${tournamentId}`;
    let sent = 0;

    for (const recipient of recipients) {
      const date = recipient.tournament_date
        ? new Date(recipient.tournament_date).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
        : 'час буде повідомлено додатково';
      const { subject, html, text } = buildOwnerNotice({
        title: `Запрошення на турнір «${recipient.tournament_name}» 🏆`,
        rows: [['Учасник', recipient.nickname || 'Гравець'], ['Початок', date]],
        buttons: [{ label: 'Переглянути запрошення', href: link, primary: true }],
      });
      await sendTransactionalEmail({ to: recipient.email, subject, html, text });
      sent += 1;
    }
    return res.status(200).json({ ok: true, sent });
  } catch (error) {
    console.error('[send-tournament-invites] ERR:', error.message);
    return res.status(500).json({ error: 'send failed' });
  }
}
