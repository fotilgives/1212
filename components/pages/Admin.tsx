import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ShieldCheck, LogOut, Users, Gift, MessageSquare, BarChart3, RefreshCw,
  Search, Plus, Minus, Check, EyeOff, Eye, Loader2, Coins, Star, Crown,
} from 'lucide-react';

const TOKEN_KEY = 'rps_admin_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}
function saveToken(t: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, t);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, t);
    localStorage.removeItem(TOKEN_KEY);
  }
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

const fmt = (n: number) => (n ?? 0).toLocaleString('uk-UA');
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' }) : '—');

interface UserRow {
  id: string; nick: string; email: string | null; login: string | null;
  balance: number; wins: number; donated: number; created: string;
  last_activity: string; is_account: boolean; is_admin: boolean;
}
interface RedRow { id: number; nick: string; reward: string; cost: number; status: string; created: string; email: string | null; }
interface ReviewRow { id: number; nick: string; rating: number; text: string; hidden: boolean; created: string; }
interface Stats { players: number; accounts: number; coins: number; redemptions_pending: number; redemptions_total: number; reviews: number; bookings: number; }

type Tab = 'stats' | 'users' | 'prizes' | 'reviews';

// ============ ВХІД ============
const Login: React.FC<{ onIn: (t: string) => void }> = ({ onIn }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null); setBusy(true);
    const { data, error } = await supabase.rpc('rps_admin_login', { p_login: login.trim(), p_password: password });
    setBusy(false);
    if (error || !data) { setErr('Невірний логін або пароль'); return; }
    const t = (data as { token: string }).token;
    saveToken(t, remember);
    onIn(t);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-center text-2xl font-extrabold text-slate-900">Адмін-панель</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Вхід лише для адміністратора</p>

        <div className="mt-6 space-y-3">
          <input
            value={login} onChange={(e) => setLogin(e.target.value)}
            placeholder="Логін" autoCapitalize="none"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
          <input
            value={password} onChange={(e) => setPassword(e.target.value)}
            type="password" placeholder="Пароль"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-emerald-600" />
            <span className="text-sm text-slate-600">Запамʼятати мене</span>
          </label>
        </div>

        {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}

        <button
          onClick={submit} disabled={busy || !login || !password}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          {busy ? 'Перевіряю…' : 'Увійти'}
        </button>
      </div>
    </div>
  );
};

// ============ ПАНЕЛЬ ============
const Admin: React.FC = () => {
  const [token, setToken] = useState<string | null>(getToken());
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('stats');

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [reds, setReds] = useState<RedRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const rpc = useCallback(async (fn: string, args: Record<string, unknown> = {}) => {
    return supabase.rpc(fn, { p_token: token, ...args });
  }, [token]);

  // Перевірка токена при завантаженні.
  useEffect(() => {
    if (!token) { setAuthed(false); return; }
    (async () => {
      const { data, error } = await supabase.rpc('rps_admin_stats', { p_token: token });
      if (error || !data) { setAuthed(false); clearToken(); return; }
      setStats(data as Stats);
      setAuthed(true);
    })();
  }, [token]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [s, u, r, rv] = await Promise.all([
      rpc('rps_admin_stats'),
      rpc('rps_admin_users'),
      rpc('rps_admin_redemptions'),
      rpc('rps_admin_reviews'),
    ]);
    if (s.data) setStats(s.data as Stats);
    if (u.data) setUsers(u.data as UserRow[]);
    if (r.data) setReds(r.data as RedRow[]);
    if (rv.data) setReviews(rv.data as ReviewRow[]);
    setLoading(false);
  }, [rpc]);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  const logout = async () => {
    if (token) await supabase.rpc('rps_admin_logout', { p_token: token });
    clearToken(); setToken(null); setAuthed(false);
  };

  const grant = async (id: string, delta: number) => {
    const { data } = await rpc('rps_admin_grant', { p_player: id, p_delta: delta });
    if (typeof data === 'number') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, balance: data as number } : u)));
    }
  };
  const setRed = async (id: number, status: string) => {
    await rpc('rps_admin_set_redemption', { p_id: id, p_status: status });
    setReds((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };
  const setReviewHidden = async (id: number, hidden: boolean) => {
    await rpc('rps_admin_set_review', { p_id: id, p_hidden: hidden });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, hidden } : r)));
  };

  if (authed === null) return <div className="grid min-h-screen place-items-center bg-slate-900 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!authed) return <Login onIn={(t) => setToken(t)} />;

  const filtered = users.filter((u) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (u.nick || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s) || (u.login || '').toLowerCase().includes(s);
  });

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'stats', label: 'Огляд', icon: BarChart3 },
    { id: 'users', label: 'Користувачі', icon: Users, badge: stats?.accounts },
    { id: 'prizes', label: 'Призи', icon: Gift, badge: stats?.redemptions_pending },
    { id: 'reviews', label: 'Відгуки', icon: MessageSquare, badge: stats?.reviews },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Шапка */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 font-extrabold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white"><ShieldCheck className="h-5 w-5" /></span>
            <span className="hidden sm:inline">Адмін-панель</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Оновити</span>
            </button>
            <button onClick={logout} className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Вийти</span>
            </button>
          </div>
        </div>
        {/* Вкладки (скрол на мобільному) */}
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id} onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
              {!!t.badge && <span className={`rounded-full px-1.5 text-xs ${tab === t.id ? 'bg-white/25' : 'bg-slate-200 text-slate-600'}`}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {/* ОГЛЯД */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { label: 'Гравців усього', value: stats.players, icon: Users, c: 'text-sky-600 bg-sky-50' },
              { label: 'Зареєстрованих', value: stats.accounts, icon: Crown, c: 'text-emerald-600 bg-emerald-50' },
              { label: 'Монет в обігу', value: stats.coins, icon: Coins, c: 'text-amber-600 bg-amber-50' },
              { label: 'Призи в роботі', value: stats.redemptions_pending, icon: Gift, c: 'text-rose-600 bg-rose-50' },
              { label: 'Призів усього', value: stats.redemptions_total, icon: Gift, c: 'text-fuchsia-600 bg-fuchsia-50' },
              { label: 'Відгуків', value: stats.reviews, icon: MessageSquare, c: 'text-indigo-600 bg-indigo-50' },
              { label: 'Заявок (запис)', value: stats.bookings, icon: Check, c: 'text-teal-600 bg-teal-50' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.c}`}><s.icon className="h-5 w-5" /></span>
                <div className="mt-3 text-2xl font-extrabold text-slate-900">{fmt(s.value)}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* КОРИСТУВАЧІ */}
        {tab === 'users' && (
          <div>
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Пошук: пошта, нік…" className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="space-y-2.5">
              {filtered.map((u) => (
                <div key={u.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        {u.is_admin && <Crown className="h-4 w-4 text-amber-500" />}
                        <span className="truncate">{u.nick || 'Гравець'}</span>
                        {u.is_account
                          ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">акаунт</span>
                          : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">гість</span>}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">{u.email || u.login || '— без пошти —'}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        активність: {fmtDate(u.last_activity)} · перемог: {u.wins ?? 0}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 font-extrabold text-amber-600">
                      <Coins className="h-4 w-4" /> {fmt(u.balance)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[100, 500, 1000].map((v) => (
                      <button key={'p' + v} onClick={() => grant(u.id, v)} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
                        <Plus className="h-3 w-3" />{v}
                      </button>
                    ))}
                    {[100, 500].map((v) => (
                      <button key={'m' + v} onClick={() => grant(u.id, -v)} className="flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100">
                        <Minus className="h-3 w-3" />{v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Нічого не знайдено.</p>}
            </div>
          </div>
        )}

        {/* ПРИЗИ */}
        {tab === 'prizes' && (
          <div className="space-y-2.5">
            {reds.map((r) => {
              const issued = r.status === 'issued';
              return (
                <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">{r.reward}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{r.nick} · {r.email || 'без пошти'} · {fmtDate(r.created)}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-600"><Coins className="h-3 w-3" />{fmt(r.cost)}</div>
                    </div>
                    <button
                      onClick={() => setRed(r.id, issued ? 'pending' : 'issued')}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${issued ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      <Check className="h-4 w-4" /> {issued ? 'Видано' : 'Позначити виданим'}
                    </button>
                  </div>
                </div>
              );
            })}
            {reds.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Заявок на призи ще немає.</p>}
          </div>
        )}

        {/* ВІДГУКИ */}
        {tab === 'reviews' && (
          <div className="space-y-2.5">
            {reviews.map((r) => (
              <div key={r.id} className={`rounded-2xl p-4 shadow-sm ring-1 ${r.hidden ? 'bg-slate-50 ring-slate-200 opacity-70' : 'bg-white ring-slate-100'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{r.nick}</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: r.rating || 0 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{r.text}</p>
                    <div className="mt-0.5 text-[11px] text-slate-400">{fmtDate(r.created)}</div>
                  </div>
                  <button
                    onClick={() => setReviewHidden(r.id, !r.hidden)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    {r.hidden ? <><Eye className="h-4 w-4" /> Показати</> : <><EyeOff className="h-4 w-4" /> Сховати</>}
                  </button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Відгуків ще немає.</p>}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
