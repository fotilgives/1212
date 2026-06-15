import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Users, Timer, Trophy, Bot, Wifi } from 'lucide-react';
import { supabase, type RoundRow, type BetRow } from '../lib/supabase';
import type { Account } from '../hooks/useAccount';

type Move = 'rock' | 'scissors' | 'paper';

const MOVES: { id: Move; label: string; emoji: string }[] = [
  { id: 'rock', label: 'Камінь', emoji: '✊' },
  { id: 'scissors', label: 'Ножиці', emoji: '✌️' },
  { id: 'paper', label: 'Папір', emoji: '✋' },
];
const STAKES = [50, 100, 200, 500];
const ROUND_SECONDS = 25;
const beatenBy: Record<Move, Move> = { rock: 'paper', scissors: 'rock', paper: 'scissors' };

const emojiOf = (m: Move) => MOVES.find((x) => x.id === m)!.emoji;
const labelOf = (m: Move) => MOVES.find((x) => x.id === m)!.label;

interface Props {
  account: Account;
  onTopUp: () => void;
}

const PoolGame: React.FC<Props> = ({ account, onTopUp }) => {
  const [round, setRound] = useState<RoundRow | null>(null);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [move, setMove] = useState<Move>('rock');
  const [stake, setStake] = useState(100);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ net: number; payout: number; move: Move; stake: number } | null>(null);

  const roundIdRef = useRef<number | null>(null);
  const advancing = useRef(false);

  const fetchBets = useCallback(async (rid: number) => {
    const { data } = await supabase.from('rps_bets').select('*').eq('round_id', rid).order('id');
    setBets((data as BetRow[]) || []);
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
    const ch = supabase
      .channel('rps-game')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rps_rounds' }, (p) => {
        const r = p.new as RoundRow;
        roundIdRef.current = r.id;
        setRound(r);
        setBets([]);
        advancing.current = false;
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rps_rounds' }, (p) => {
        const r = p.new as RoundRow;
        if (r.id === roundIdRef.current) setRound(r);
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
          setLastResult({ net: b.payout - b.stake, payout: b.payout, move: b.move as Move, stake: b.stake });
          account.refresh();
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
    }, 300);
    return () => window.clearInterval(id);
  }, [round, loadCurrent]);

  const [botBusy, setBotBusy] = useState(false);
  const [autoFill, setAutoFill] = useState(true);
  const filledRef = useRef<number | null>(null);

  const fillRound = useCallback(async () => {
    setBotBusy(true);
    await supabase.rpc('rps_fill', { p_target: 20 });
    if (roundIdRef.current) await fetchBets(roundIdRef.current);
    setBotBusy(false);
  }, [fetchBets]);

  // Auto-fill each new round up to 20 players so the lobby is never empty.
  useEffect(() => {
    if (!autoFill || !round || round.status !== 'betting') return;
    if (filledRef.current === round.id) return;
    filledRef.current = round.id;
    const t = window.setTimeout(() => {
      supabase.rpc('rps_fill', { p_target: 20 }).then(() => {
        if (roundIdRef.current === round.id) fetchBets(round.id);
      });
    }, 400 + Math.random() * 900);
    return () => window.clearTimeout(t);
  }, [round, autoFill, fetchBets]);

  const myBet = bets.find((b) => b.player_id === account.playerId) || null;
  const potOf = (m: Move) => bets.filter((b) => b.move === m).reduce((s, b) => s + b.stake, 0);
  const bank = bets.reduce((s, b) => s + b.stake, 0);

  const placeBet = async () => {
    if (busy || myBet) return;
    if (account.balance < stake) {
      onTopUp();
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc('rps_place_bet', {
      p_id: account.playerId,
      p_nick: account.nickname,
      p_move: move,
      p_stake: stake,
    });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('insufficient')) onTopUp();
      else if (msg.includes('round closed')) {
        setErr('Раунд щойно завершився — зачекай наступний 🙂');
        loadCurrent();
      } else if (msg.includes('already bet')) setErr('Ти вже зробив ставку в цьому раунді');
      else setErr('Не вдалося поставити. Спробуй ще раз.');
    } else {
      setLastResult(null);
      await account.refresh();
      if (roundIdRef.current) await fetchBets(roundIdRef.current);
    }
    setBusy(false);
  };

  return (
    <section id="game" className="mx-auto max-w-3xl px-5 py-14">
      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
              Онлайн-раунд
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                <Wifi className="h-3 w-3" /> наживо
              </span>
            </h2>
            <p className="text-xs text-slate-500">Грай разом з іншими · спільний банк · камінь→ножиці→папір→камінь</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            <Coins className="h-4 w-4" />
            {account.balance}
          </div>
        </div>

        <div className="p-6">
          {/* Nickname */}
          <div className="mb-5 flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Імʼя</label>
            <input
              value={account.nickname}
              onChange={(e) => account.setNickname(e.target.value.slice(0, 20))}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              placeholder="Твоє імʼя у грі"
            />
          </div>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 py-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Users className="h-3.5 w-3.5" /> Гравців
              </div>
              <div className="mt-1 text-xl font-extrabold text-slate-900">{bets.length}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 py-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Trophy className="h-3.5 w-3.5" /> Банк
              </div>
              <div className="mt-1 text-xl font-extrabold text-emerald-600">{bank}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 py-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Timer className="h-3.5 w-3.5" /> Час
              </div>
              <div className="mt-1 text-xl font-extrabold text-slate-900">{round ? `${remaining}с` : '…'}</div>
            </div>
          </div>

          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-linear"
              style={{ width: `${Math.min(100, (remaining / ROUND_SECONDS) * 100)}%` }}
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                checked={autoFill}
                onChange={(e) => setAutoFill(e.target.checked)}
                className="h-3.5 w-3.5 accent-emerald-600"
              />
              Авто-боти (до 20 щораунду)
            </label>
            <button
              onClick={fillRound}
              disabled={botBusy || remaining <= 1}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
            >
              <Bot className="h-3.5 w-3.5" /> {botBusy ? 'Додаю…' : 'Заповнити до 20'}
            </button>
          </div>

          {/* Pools */}
          <div className="grid grid-cols-3 gap-3">
            {MOVES.map((m) => {
              const isMine = myBet?.move === m.id;
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4 text-center transition ${
                    isMine ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-4xl">{m.emoji}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">{m.label}</div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-emerald-600">
                    <Coins className="h-3.5 w-3.5" /> {potOf(m.id)}
                  </div>
                  <div className="text-xs text-slate-400">{bets.filter((b) => b.move === m.id).length} гравц.</div>
                  {isMine && <div className="mt-1 text-[11px] font-bold text-emerald-600">твоя ставка</div>}
                </div>
              );
            })}
          </div>

          {/* Last result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 rounded-2xl p-4 text-center text-sm font-bold ${
                  lastResult.net > 0
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : lastResult.net < 0
                    ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Минулий раунд: {emojiOf(lastResult.move)}{' '}
                {lastResult.net > 0
                  ? `виграш +${lastResult.net} монет 🎉`
                  : lastResult.net < 0
                  ? `програш ${lastResult.net} монет`
                  : 'ставку повернено'}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-6">
            {myBet ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
                <p className="text-sm font-semibold text-emerald-800">
                  Ставку прийнято: {emojiOf(myBet.move as Move)} {labelOf(myBet.move as Move)} · {myBet.stake} монет
                </p>
                <p className="mt-1 text-xs text-emerald-700">Чекаємо завершення раунду… результат прийде автоматично.</p>
              </div>
            ) : (
              <>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Твій хід</div>
                <div className="grid grid-cols-3 gap-3">
                  {MOVES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMove(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-2xl border py-4 transition ${
                        move === m.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-sm font-semibold text-slate-700">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Ставка</div>
                <div className="flex flex-wrap gap-2">
                  {STAKES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStake(s)}
                      className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                        stake === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5" /> {s}
                    </button>
                  ))}
                </div>

                <button
                  onClick={placeBet}
                  disabled={busy || remaining <= 1}
                  className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
                >
                  {account.balance < stake
                    ? 'Поповнити баланс'
                    : remaining <= 1
                    ? 'Раунд закінчується…'
                    : `Поставити ${stake} монет`}
                </button>
                {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}
              </>
            )}
          </div>

          {/* Who's in */}
          {bets.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {bets.slice(0, 12).map((b) => (
                <span
                  key={b.id}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    b.player_id === account.playerId
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {emojiOf(b.move as Move)} {b.nickname}
                </span>
              ))}
              {bets.length > 12 && <span className="px-1 text-xs text-slate-400">+{bets.length - 12}</span>}
            </div>
          )}

          <p className="mt-5 text-center text-xs text-slate-400">
            Реальний онлайн: усі гравці грають в одному раунді. Зароблені монети згодом можна буде витратити на послуги
            або вивести. Поки що — демо на віртуальних монетах.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PoolGame;
