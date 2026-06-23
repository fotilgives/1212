import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Users, Wifi } from 'lucide-react';
import { supabase, type RoundRow, type BetRow } from '../lib/supabase';
import type { Account } from '../hooks/useAccount';
import AnimatedNumber from './AnimatedNumber';
import Confetti from './Confetti';
import { LogIn } from 'lucide-react';

type Move = 'rock' | 'scissors' | 'paper';

const MOVES: { id: Move; label: string; emoji: string }[] = [
  { id: 'rock', label: 'Камінь', emoji: '✊' },
  { id: 'scissors', label: 'Ножиці', emoji: '✌️' },
  { id: 'paper', label: 'Папір', emoji: '✋' },
];
const STAKE = 100; // фіксована ставка раунду
const ROUND_SECONDS = 30;

const emojiOf = (m: Move) => MOVES.find((x) => x.id === m)!.emoji;
const labelOf = (m: Move) => MOVES.find((x) => x.id === m)!.label;

const MOVE_IMG: Record<Move, string> = {
  rock: '/images/game/rock.png',
  scissors: '/images/game/scissors.png',
  paper: '/images/game/paper.png',
};

const RING = 46;
const CIRC = 2 * Math.PI * RING;

interface Props {
  account: Account;
  onTopUp: () => void;
  onLogin: () => void;
}

const PoolGame: React.FC<Props> = ({ account, onTopUp, onLogin }) => {
  const [round, setRound] = useState<RoundRow | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [move, setMove] = useState<Move>('rock');
  const [bluff, setBluff] = useState(false);
  const [shownMove, setShownMove] = useState<Move>('paper');
  const [myPlay, setMyPlay] = useState<{ real: Move; shown: Move; bluff: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ net: number; payout: number; move: Move; stake: number; isBluff: boolean } | null>(null);
  const [lastWin, setLastWin] = useState<Move | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [bonus, setBonus] = useState<{ amount: number; cycle_day: number; max_day: number } | null>(null);
  // Ставка й тривалість раунду керуються з адмінки (rps_config). Дефолти 100/30.
  const [stake, setStake] = useState(STAKE);
  const [roundSeconds, setRoundSeconds] = useState(ROUND_SECONDS);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('rps_config').select('data').eq('id', 1).single();
      const cfg = (data as { data?: Record<string, number> } | null)?.data;
      const st = Number(cfg?.stake);
      const rs = Number(cfg?.round_seconds);
      if (Number.isFinite(st) && st >= 1) setStake(Math.floor(st));
      if (Number.isFinite(rs) && rs >= 5) setRoundSeconds(Math.floor(rs));
    })();
  }, []);

  // Екран правил при вході в гру (показуємо, поки гравець не погодиться).
  const [rulesOk, setRulesOk] = useState(() => {
    try { return localStorage.getItem('rps_rules_accepted') === '1'; } catch { return false; }
  });
  const acceptRules = () => {
    try { localStorage.setItem('rps_rules_accepted', '1'); } catch { /* ignore */ }
    setRulesOk(true);
  };

  // Блеф завжди доступний (не прив'язаний до попередньої перемоги).
  const canBluff = true;

  useEffect(() => {
    if (!canBluff && bluff) setBluff(false);
  }, [canBluff, bluff]);

  const roundIdRef = useRef<number | null>(null);
  const advancing = useRef(false);


  const fetchBets = useCallback(async (rid: number) => {
    const { data } = await supabase.from('rps_bets').select('*').eq('round_id', rid).order('id');
    setBets((data as BetRow[]) || []);
  }, []);

  const fetchBonus = useCallback(async () => {
    const { data } = await supabase.rpc('rps_bonus');
    if (data) setBonus(data as { amount: number; cycle_day: number; max_day: number });
  }, []);

  const loadCurrent = useCallback(async () => {
    const { data, error } = await supabase.rpc('rps_tick');
    if (error || !data) return;
    const r = data as RoundRow;
    roundIdRef.current = r.id;
    setRound(r);
    await fetchBets(r.id);
  }, [fetchBets]);

  // Initial load + realtime subscriptions
  useEffect(() => {
    loadCurrent();
    fetchBonus();
    const ch = supabase
      .channel('rps-game')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rps_rounds' }, (p) => {
        const r = p.new as RoundRow;
        roundIdRef.current = r.id;
        setRound(r);
        setBets([]);
        setMyPlay(null);
        advancing.current = false;
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_rounds' }, (p) => {
        const r = p.new as RoundRow;
        if (r.id === roundIdRef.current) {
          setRound(r);
          if (r.status === 'settled' && r.win_move) {
            setLastWin(r.win_move as Move);
            fetchBonus();
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rps_bets' }, (p) => {
        const b = p.new as BetRow;
        if (b.round_id === roundIdRef.current) {
          setBets((prev) => (prev.some((x) => x.id === b.id) ? prev : [...prev, b]));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_bets' }, (p) => {
        const b = p.new as BetRow;
        if (b.player_id === account.playerId) {
          setLastResult({ net: b.payout - b.stake, payout: b.payout, move: b.move as Move, stake: b.stake, isBluff: b.is_bluff });
          if (b.payout > b.stake) {
            setCelebrate(true);
            window.setTimeout(() => setCelebrate(false), 2600);
          }
          account.refresh();
          fetchBonus();
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.playerId]);

  // Synced countdown from server ends_at; advance when expired.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!round) return;
      const ms = new Date(round.ends_at).getTime() - Date.now();
      setRemaining(Math.max(0, Math.ceil(ms / 1000)));
      if (ms <= 0 && round.status === 'betting' && !advancing.current) {
        advancing.current = true;
        loadCurrent().finally(() => window.setTimeout(() => (advancing.current = false), 2000));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [round, loadCurrent]);

  const filledRef = useRef<number | null>(null);

  // Auto-fill: боти заходять автоматично й ПОСТУПОВО протягом раунду (за сценарієм).
  useEffect(() => {
    if (!round || round.status !== 'betting') return;
    if (filledRef.current === round.id) return;
    filledRef.current = round.id;

    const finalTarget = 14 + Math.floor(Math.random() * 7); // 14-20
    let current = 2 + Math.floor(Math.random() * 3); // старт 2-4
    let cancelled = false;
    let timer = 0;

    const step = async () => {
      if (cancelled) return;
      const t = Math.min(finalTarget, current);
      await supabase.rpc('rps_fill', { p_target: t });
      if (!cancelled && roundIdRef.current === round.id) fetchBets(round.id);
      if (!cancelled && t < finalTarget) {
        current += 2 + Math.floor(Math.random() * 3); // +2..4 щокроку
        timer = window.setTimeout(step, 1500 + Math.random() * 1800);
      }
    };

    timer = window.setTimeout(step, 500 + Math.random() * 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [round, fetchBets]);

  const myBet = bets.find((b) => b.player_id === account.playerId) || null;
  const potOf = (m: Move) => bets.filter((b) => b.move === m).reduce((s, b) => s + b.stake, 0);
  const bank = bets.reduce((s, b) => s + b.stake, 0);

  const placeBet = async () => {
    if (busy || myBet) return;
    if (account.balance < stake) {
      onTopUp();
      return;
    }
    const useBluff = bluff && canBluff && shownMove !== move;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc('rps_place_bet', {
      p_id: account.playerId,
      p_nick: account.nickname,
      p_move: move,
      p_stake: stake,
      p_shown_move: useBluff ? shownMove : move,
      p_is_bluff: useBluff,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('insufficient')) onTopUp();
      else if (msg.includes('bluff locked')) setErr('Блеф відкриється після першої перемоги 🔒');
      else if (msg.includes('round closed')) {
        setErr('Раунд щойно завершився - зачекай наступний 🙂');
        loadCurrent();
      } else if (msg.includes('already bet')) setErr('Ти вже зробив ставку в цьому раунді');
      else setErr('Не вдалося поставити. Спробуй ще раз.');
    } else {
      setLastResult(null);
      setMyPlay({ real: move, shown: useBluff ? shownMove : move, bluff: useBluff });
      await account.refresh();
      if (roundIdRef.current) await fetchBets(roundIdRef.current);
    }
    setBusy(false);
  };

  const low = remaining <= 5;
  const progress = Math.min(1, Math.max(0, remaining / roundSeconds));

  return (
    <section id="game" className="mx-auto max-w-3xl px-3 py-10 sm:px-5 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[2.25rem] bg-white shadow-[0_30px_80px_-25px_rgba(6,78,59,0.4)] ring-1 ring-emerald-100/70"
      >
        <AnimatePresence>{celebrate && <Confetti />}</AnimatePresence>

        {/* ── Екран правил (поки не погодився) ── */}
        <AnimatePresence>
          {!rulesOk && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col bg-white"
            >
              <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-5 py-6 text-white sm:px-7">
                <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <h2 className="relative text-xl font-black sm:text-2xl">Як грати 🎮</h2>
                <p className="relative mt-1 text-sm text-emerald-50/90">Прочитай правила — це займе хвилинку. Тоді почнемо 🌿</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 sm:px-7">
                {[
                  ['✊✌️✋', 'Обери хід', 'Камінь, ножиці або папір. Камінь б’є ножиці, ножиці — папір, папір — камінь.'],
                  ['🪙', 'Ставка', `${stake} монет за раунд — однакова для всіх гравців.`],
                  ['⏱️', 'Раунд', `Триває ${roundSeconds} секунд. Усі грають одночасно у спільний банк.`],
                  ['🎁', 'Виграш', 'Після раунду нараховуємо монети за твій хід. Що вдаліший хід у цьому раунді — то більший виграш.'],
                  ['🤫', 'Блеф', 'Можеш показати суперникам один хід, а зіграти інший — заплутай їх.'],
                  ['⚡', 'Заходь регулярно', 'Монети ігрові (демо). Без активності бонуси поступово «тануть» — грай частіше, щоб тримати форму.'],
                ].map(([emoji, title, desc]) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <span className="text-2xl leading-none">{emoji}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{title}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="shrink-0 border-t border-slate-100 bg-white p-4 sm:px-7">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={acceptRules}
                  className="shine w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:from-emerald-700 hover:to-teal-600"
                >
                  Погоджуюсь — грати →
                </motion.button>
                <p className="mt-2 text-center text-[11px] text-slate-400">Натискаючи «Грати», ти приймаєш правила гри</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero header (rich gradient) ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-5 pb-6 pt-5 text-white sm:px-7 sm:pt-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-teal-300/20 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">Онлайн-раунд</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm">
                  <motion.span
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-200"
                  />
                  <Wifi className="h-3 w-3" /> наживо
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-50/80">Камінь · ножиці · папір · спільний банк</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-white/15 px-3.5 py-2 text-sm font-black ring-1 ring-white/25 backdrop-blur-sm">
              <Coins className="h-4 w-4 text-amber-300" />
              <AnimatedNumber value={account.balance} />
            </div>
          </div>

          {/* Timer + stats — hero */}
          <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-50/70">
                <Users className="h-3.5 w-3.5" /> Гравців
              </div>
              <div className="mt-0.5 text-3xl font-black tabular-nums sm:text-4xl">
                <AnimatedNumber value={bets.length} />
              </div>
            </div>

            <div className="relative mx-auto h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <circle cx="55" cy="55" r={RING} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
                <motion.circle
                  cx="55"
                  cy="55"
                  r={RING}
                  fill="none"
                  stroke={low ? '#fda4af' : 'url(#ringGrad)'}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  style={{ filter: `drop-shadow(0 0 8px ${low ? 'rgba(244,63,94,.55)' : 'rgba(52,211,153,.55)'})` }}
                  animate={{ strokeDashoffset: CIRC * (1 - progress) }}
                  transition={{ ease: 'linear', duration: 0.25 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={remaining}
                  initial={{ scale: low ? 1.35 : 1, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-3xl font-black tabular-nums sm:text-4xl ${low ? 'text-rose-200' : 'text-white'}`}
                >
                  {round ? remaining : '…'}
                </motion.span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-50/70">секунд</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-50/70">Банк</div>
              <div className="mt-0.5 flex items-center justify-center gap-1 text-3xl font-black text-amber-200 tabular-nums sm:text-4xl">
                <AnimatedNumber value={bank} />
              </div>
              <div className="text-[10px] font-medium text-emerald-50/60">монет</div>
            </div>
          </div>
        </div>

        {/* ── Банк центру (gold strip) ── */}
        {bonus && (
          <div className="relative flex items-center gap-3 border-b border-amber-100 bg-gradient-to-r from-amber-100 via-amber-50 to-transparent px-5 py-3 sm:px-7">
            <div
              className="h-11 w-11 shrink-0 rounded-2xl overflow-hidden ring-1 ring-amber-200/80 sm:h-12 sm:w-12"
              dangerouslySetInnerHTML={{
                __html: `<video src="/images/game/bank.mp4" poster="/images/game/bank.png" autoplay loop muted playsinline preload="auto" class="h-full w-full object-cover"></video>`
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-black text-amber-900">Банк центру</span>
                <span className="inline-flex items-center gap-1 text-sm font-black text-amber-700">
                  <Coins className="h-4 w-4" /><AnimatedNumber value={bonus.amount} />
                </span>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">ліміт на день</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-amber-700/70">
                {bonus.amount > 0
                  ? 'Звідси гравці виграють бали · оновлюється щодня 🏆'
                  : 'Ліміт на сьогодні вичерпано — гравці грають між собою'}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6">
          {/* Nickname + account */}
          <div className="mb-2 flex items-center gap-2">
            <input
              value={account.nickname}
              onChange={(e) => account.setNickname(e.target.value.slice(0, 20))}
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              placeholder="Твоє імʼя у грі"
            />
            {account.isAccount ? (
              <button
                onClick={account.logout}
                className="shrink-0 rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Вийти
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex shrink-0 items-center gap-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <LogIn className="h-3.5 w-3.5" /> Увійти
              </button>
            )}
          </div>
          <p className="mb-5 text-[11px] text-slate-400">
            {account.isAccount
              ? '✓ Ти в акаунті — баланс зберігається на будь-якому пристрої.'
              : 'Граєш як гість (баланс лише в цьому браузері). Увійди, щоб зберігати скрізь.'}
          </p>

          {/* Pools */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {MOVES.map((m, i) => {
              const pot = potOf(m.id);
              const cnt = bets.filter((b) => b.move === m.id).length;
              const isMine = myBet?.move === m.id;
              const share = bank > 0 ? pot / bank : 0;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`relative overflow-hidden rounded-3xl border p-3 text-center transition sm:p-4 ${
                    isMine
                      ? 'border-emerald-300 bg-gradient-to-b from-emerald-50 to-white shadow-xl shadow-emerald-200/50'
                      : 'border-slate-100 bg-gradient-to-b from-slate-50/80 to-white shadow-sm'
                  }`}
                >
                  {isMine && (
                    <div className="absolute right-2 top-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">ти</div>
                  )}
                  <motion.img
                    src={MOVE_IMG[m.id]}
                    alt={m.label}
                    className="mx-auto h-14 w-14 object-contain drop-shadow-md sm:h-[68px] sm:w-[68px]"
                    animate={isMine ? { scale: [1, 1.12, 1], y: [0, -3, 0] } : { y: [0, -2, 0] }}
                    transition={{ duration: isMine ? 1.6 : 3, repeat: Infinity, delay: i * 0.3 }}
                  />
                  <div className="mt-1 text-sm font-bold text-slate-800">{m.label}</div>
                  <div className="mt-1.5 flex items-center justify-center gap-1 text-sm font-black text-emerald-600">
                    <Coins className="h-3.5 w-3.5 text-amber-500" /> <AnimatedNumber value={pot} />
                  </div>
                  <div className="text-[11px] text-slate-400">{cnt} гравц.</div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      animate={{ width: `${share * 100}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Last result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-4 text-center text-sm font-bold text-emerald-700 ring-1 ring-emerald-200"
              >
                <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
                  <span className="inline-flex items-center gap-1.5">
                    <img src={MOVE_IMG[lastResult.move]} alt="" className="h-7 w-7 object-contain" />
                    <span>Твій хід{lastResult.isBluff && <span className="ml-1">🤫 блеф</span>}</span>
                  </span>
                  <span className="opacity-40">·</span>
                  <span>{`виграш ${lastResult.payout} монет 🎉`}</span>
                </div>
                {lastWin && (
                  <div className="mt-1 text-xs font-medium opacity-80">
                    Виграшний хід раунду: {emojiOf(lastWin)} {labelOf(lastWin)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-6">
            <AnimatePresence mode="wait">
              {myBet ? (
                <motion.div
                  key="placed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100"
                >
                  {myPlay?.bluff ? (
                    <>
                      <p className="text-sm font-semibold text-emerald-800">
                        Ставку прийнято 🤫 Блеф · {myBet.stake} монет
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">
                        Суперники бачать {emojiOf(myPlay.shown)} {labelOf(myPlay.shown)}, а зіграє твій справжній{' '}
                        {emojiOf(myPlay.real)} {labelOf(myPlay.real)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-emerald-800">
                        Ставку прийнято: {emojiOf(myBet.move as Move)} {labelOf(myBet.move as Move)} · {myBet.stake} монет
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">Чекаємо завершення раунду… результат прийде автоматично.</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Твій хід</div>
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {MOVES.map((m) => {
                      const sel = move === m.id;
                      return (
                        <motion.button
                          key={m.id}
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setMove(m.id);
                            if (bluff && shownMove === m.id) {
                              setShownMove(MOVES.find((x) => x.id !== m.id)!.id);
                            }
                          }}
                          className={`relative flex flex-col items-center gap-1.5 rounded-3xl border-2 py-4 transition sm:py-5 ${
                            sel
                              ? 'border-emerald-400 bg-gradient-to-b from-emerald-50 to-white shadow-xl shadow-emerald-200/60 ring-2 ring-emerald-200'
                              : 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md'
                          }`}
                        >
                          {sel && (
                            <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[11px] text-white">✓</span>
                          )}
                          <img src={MOVE_IMG[m.id]} alt={m.label} className="h-12 w-12 object-contain drop-shadow-md sm:h-16 sm:w-16" />
                          <span className={`text-xs font-bold sm:text-sm ${sel ? 'text-emerald-700' : 'text-slate-700'}`}>{m.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Bluff */}
                  <div className="mt-4">
                    <div className="flex justify-center">
                      <motion.button
                        type="button"
                        whileHover={{ scale: canBluff ? 1.03 : 1, y: canBluff ? -2 : 0 }}
                        whileTap={{ scale: canBluff ? 0.96 : 1 }}
                        disabled={!canBluff}
                        onClick={() => {
                          const next = !bluff;
                          setBluff(next);
                          if (next && shownMove === move) {
                            setShownMove(MOVES.find((m) => m.id !== move)!.id);
                          }
                        }}
                        className={`flex w-full flex-col items-center gap-1 rounded-2xl border py-3.5 transition ${
                          !canBluff
                            ? 'cursor-not-allowed border-slate-100 bg-slate-50'
                            : bluff
                            ? 'border-violet-400 bg-violet-50 shadow-lg shadow-violet-200/50'
                            : 'border-slate-200 bg-white hover:border-violet-300'
                        }`}
                      >
                        <span className="text-3xl">🤫</span>
                        <span className={`text-sm font-semibold ${!canBluff ? 'text-slate-300' : bluff ? 'text-violet-700' : 'text-slate-700'}`}>
                          {!canBluff ? 'Блеф 🔒' : bluff ? 'Блеф увімкнено' : 'Блеф'}
                        </span>
                      </motion.button>
                    </div>
                    <AnimatePresence>
                      {canBluff && bluff && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wide text-violet-400">
                            Показати суперникам як
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {MOVES.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => setShownMove(m.id)}
                                disabled={m.id === move}
                                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                                  m.id === move
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                                    : shownMove === m.id
                                    ? 'border-violet-400 bg-violet-100 text-violet-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                                }`}
                              >
                                {m.emoji} {m.label}
                              </button>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] text-violet-500">
                            Усі бачитимуть {emojiOf(shownMove)}, а зіграє твій справжній {emojiOf(move)} 🤫
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {!canBluff && (
                      <p className="mt-2 text-center text-[11px] text-violet-400">
                        Виграй раунд, щоб розблокувати блеф (програш або 2+ пропуски знімають доступ)
                      </p>
                    )}
                  </div>

                  <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ставка</div>
                  <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/90 text-white">
                      <Coins className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-xl font-black text-slate-900">{stake}</span>
                    <span className="text-sm font-medium text-slate-500">монет — фіксована для всіх</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={placeBet}
                    disabled={busy || remaining <= 1}
                    className="shine mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50"
                  >
                    {account.balance < stake
                      ? '💰 Поповнити баланс'
                      : remaining <= 1
                      ? 'Раунд закінчується…'
                      : `Поставити ${stake} монет`}
                  </motion.button>
                  {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Who's in */}
          {bets.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              <AnimatePresence>
                {bets.slice(0, 14).map((b) => (
                  <motion.span
                    key={b.id}
                    layout
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      b.player_id === account.playerId ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                    }`}
                  >
                    {emojiOf(b.move as Move)} {b.nickname}
                    {b.is_bluff && round?.status === 'settled' && <span className="ml-0.5">🤫</span>}
                  </motion.span>
                ))}
              </AnimatePresence>
              {bets.length > 14 && <span className="px-1 text-xs text-slate-400">+{bets.length - 14}</span>}
            </div>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            Реальний онлайн: усі гравці грають в одному раунді. Виграєш — отримуєш payout з реального банку раунду.
          </p>

          {/* Опис «таяння бонусів» */}
          <div className="mt-5 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-amber-700">
              ⚡ Що таке «таяння бонусів»
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Бонуси — це як <b>енергія</b>. Займатися собою потрібно щодня. Якщо нічого не практикувати
              3 дні, рівень енергії поступово спадає — і з кожним тижнем стаєш трохи слабшим. Тому гра —
              це <b>тренажер самоконтролю й дисципліни</b>: коли ми втрачаємо енергію, це помітно лише з часом,
              а коли втрачаємо бали — помітно одразу. Тож починай з малого ☺️👍
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              <b>Як це працює:</b> після 3 днів без активності баланс зменшується на <b>1%</b>, далі — ще
              по <b>1% щотижня</b>, поки не виконаєш хоча б одну умову.
            </p>
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-700">Як уникнути (таймер скидається на 3 дні):</div>
              <ul className="mt-1.5 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2">
                <li>🎮 зіграти 5 раундів</li>
                <li>💳 оплатити щось на сайті</li>
                <li>🤝 запросити учасника</li>
                <li>➕ поповнити рахунок</li>
                <li>🎁 розрахуватися бонусами</li>
                <li>⭐ написати відгук</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default PoolGame;
