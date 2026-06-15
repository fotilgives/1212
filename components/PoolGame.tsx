import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Users, Timer, Trophy, RefreshCw, ArrowRight } from 'lucide-react';
import type { Wallet } from '../hooks/useWallet';

type Move = 'rock' | 'scissors' | 'paper';
type Phase = 'betting' | 'result';

const MOVES: { id: Move; label: string; emoji: string }[] = [
  { id: 'rock', label: 'Камінь', emoji: '✊' },
  { id: 'scissors', label: 'Ножиці', emoji: '✌️' },
  { id: 'paper', label: 'Папір', emoji: '✋' },
];

const STAKES = [50, 100, 200, 500];
const ROUND_SECONDS = 20;

// Камінь б'є ножиці, ножиці б'ють папір, папір б'є камінь.
const beats: Record<Move, Move> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
// Хто б'є цей хід (тобто кому дістається його банк).
const beatenBy: Record<Move, Move> = { rock: 'paper', scissors: 'rock', paper: 'scissors' };

const emojiOf = (m: Move) => MOVES.find((x) => x.id === m)!.emoji;
const labelOf = (m: Move) => MOVES.find((x) => x.id === m)!.label;

interface Bet {
  id: string;
  name: string;
  move: Move;
  stake: number;
  isPlayer: boolean;
}

const NICKS = [
  'Олег', 'Марія', 'Дмитро', 'Іра', 'Назар', 'Софія', 'Артем', 'Юля', 'Влад', 'Оля',
  'Тарас', 'Каті', 'Макс', 'Аня', 'Ігор', 'Лєра', 'Рома', 'Віка', 'Сергій', 'Даша',
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeBots(): Bet[] {
  const count = randInt(13, 18);
  const shuffled = [...NICKS].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${i}`,
    name: shuffled[i % shuffled.length],
    move: MOVES[randInt(0, 2)].id,
    // боти частіше ставлять менше
    stake: STAKES[Math.min(randInt(0, 3), randInt(0, 3))],
    isPlayer: false,
  }));
}

function potOf(bets: Bet[], m: Move) {
  return bets.filter((b) => b.move === m).reduce((s, b) => s + b.stake, 0);
}

/** Розподіл банку за правилом «по колу парами». Повертає виплату для кожної ставки. */
function settle(bets: Bet[]): Record<string, number> {
  const payout: Record<string, number> = {};
  bets.forEach((b) => (payout[b.id] = 0));

  (['rock', 'scissors', 'paper'] as Move[]).forEach((m) => {
    const pot = potOf(bets, m);
    if (pot <= 0) return;
    // Банк ходу m дістається тим, хто його б'є; якщо таких немає — повертається власникам.
    let recipients = bets.filter((b) => b.move === beatenBy[m]);
    if (recipients.length === 0) recipients = bets.filter((b) => b.move === m);
    const recipPot = recipients.reduce((s, b) => s + b.stake, 0);
    let distributed = 0;
    recipients.forEach((b, i) => {
      const amt = i === recipients.length - 1 ? pot - distributed : Math.floor((pot * b.stake) / recipPot);
      payout[b.id] += amt;
      distributed += amt;
    });
  });

  return payout;
}

interface Props {
  wallet: Wallet;
  onTopUp: () => void;
}

const PoolGame: React.FC<Props> = ({ wallet, onTopUp }) => {
  const [phase, setPhase] = useState<Phase>('betting');
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [move, setMove] = useState<Move>('rock');
  const [stake, setStake] = useState(100);

  const botsRef = useRef<Bet[]>(makeBots());
  const [revealed, setRevealed] = useState(0);
  const [playerBet, setPlayerBet] = useState<Bet | null>(null);
  const [result, setResult] = useState<{ payout: number; net: number; bets: Bet[] } | null>(null);

  const placedBots = botsRef.current.slice(0, revealed);
  const liveBets: Bet[] = playerBet ? [...placedBots, playerBet] : placedBots;

  const resolve = useCallback(() => {
    const allBets = playerBet ? [...botsRef.current, playerBet] : [...botsRef.current];
    const payout = settle(allBets);
    if (playerBet) {
      const won = payout[playerBet.id] || 0;
      if (won > 0) wallet.deposit(won);
      setResult({ payout: won, net: won - playerBet.stake, bets: allBets });
    } else {
      setResult({ payout: 0, net: 0, bets: allBets });
    }
    setRevealed(botsRef.current.length);
    setPhase('result');
  }, [playerBet, wallet]);

  // Таймер раунду + поступове «заповнення» лобі ботами.
  useEffect(() => {
    if (phase !== 'betting') return;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          resolve();
          return 0;
        }
        return s - 1;
      });
      setRevealed((r) => Math.min(botsRef.current.length, r + randInt(1, 3)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, resolve]);

  const placeBet = () => {
    if (playerBet) return;
    if (wallet.balance < stake) {
      onTopUp();
      return;
    }
    wallet.withdraw(stake);
    setPlayerBet({ id: 'you', name: 'Ти', move, stake, isPlayer: true });
  };

  const newRound = () => {
    botsRef.current = makeBots();
    setRevealed(randInt(3, 6));
    setPlayerBet(null);
    setResult(null);
    setSeconds(ROUND_SECONDS);
    setPhase('betting');
  };

  const totalBank = liveBets.reduce((s, b) => s + b.stake, 0);
  const players = liveBets.length;

  return (
    <section id="game" className="mx-auto max-w-3xl px-5 py-14">
      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-md">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Раунд · спільний банк</h2>
            <p className="text-xs text-slate-500">Камінь б'є ножиці · ножиці б'ють папір · папір б'є камінь</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            <Coins className="h-4 w-4" />
            {wallet.balance}
          </div>
        </div>

        <div className="p-6">
          {/* Stats row */}
          <div className="mb-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-slate-50 py-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Users className="h-3.5 w-3.5" /> Гравців
              </div>
              <div className="mt-1 text-xl font-extrabold text-slate-900">{players}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 py-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Trophy className="h-3.5 w-3.5" /> Банк
              </div>
              <div className="mt-1 text-xl font-extrabold text-emerald-600">{totalBank}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 py-3">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Timer className="h-3.5 w-3.5" /> Час
              </div>
              <div className="mt-1 text-xl font-extrabold text-slate-900">{phase === 'betting' ? `${seconds}с` : '—'}</div>
            </div>
          </div>

          {/* Timer bar */}
          {phase === 'betting' && (
            <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(seconds / ROUND_SECONDS) * 100}%` }}
              />
            </div>
          )}

          {/* Pools */}
          <div className="grid grid-cols-3 gap-3">
            {MOVES.map((m) => {
              const pot = potOf(liveBets, m.id);
              const cnt = liveBets.filter((b) => b.move === m.id).length;
              const isPlayerMove = playerBet?.move === m.id;
              const isWinningHint = result && result.bets.length > 0;
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4 text-center transition ${
                    isPlayerMove ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-4xl">{m.emoji}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">{m.label}</div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-sm font-bold text-emerald-600">
                    <Coins className="h-3.5 w-3.5" /> {pot}
                  </div>
                  <div className="text-xs text-slate-400">{cnt} гравц.</div>
                  {isPlayerMove && <div className="mt-1 text-[11px] font-bold text-emerald-600">твоя ставка</div>}
                  {isWinningHint && null}
                </div>
              );
            })}
          </div>

          {/* Betting controls / result */}
          <AnimatePresence mode="wait">
            {phase === 'betting' ? (
              <motion.div key="bet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6">
                {playerBet ? (
                  <div className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
                    <p className="text-sm font-semibold text-emerald-800">
                      Ставку прийнято: {emojiOf(playerBet.move)} {labelOf(playerBet.move)} · {playerBet.stake} монет
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">Чекаємо завершення раунду…</p>
                    <button
                      onClick={resolve}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Розіграти зараз <ArrowRight className="h-4 w-4" />
                    </button>
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
                            move === m.id
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
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
                      className="mt-5 w-full rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
                    >
                      {wallet.balance < stake ? 'Поповнити баланс' : `Поставити ${stake} монет`}
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="res" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6">
                {playerBet ? (
                  <div
                    className={`rounded-2xl p-5 text-center ${
                      result && result.net > 0
                        ? 'bg-emerald-50 ring-1 ring-emerald-200'
                        : result && result.net < 0
                        ? 'bg-rose-50 ring-1 ring-rose-200'
                        : 'bg-slate-100'
                    }`}
                  >
                    <div className="text-3xl">{emojiOf(playerBet.move)}</div>
                    <p className="mt-2 text-lg font-extrabold text-slate-900">
                      {result && result.net > 0 && `Виграш +${result.net} монет 🎉`}
                      {result && result.net < 0 && `Програш ${result.net} монет`}
                      {result && result.net === 0 && 'Ставку повернено'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Тобі з банку: {result?.payout} монет · твоя ставка була {playerBet.stake}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-100 p-5 text-center text-sm font-semibold text-slate-600">
                    Цей раунд ти пропустив. Зроби ставку в наступному!
                  </div>
                )}

                {/* Flow summary */}
                <div className="mt-4 space-y-2">
                  {(['rock', 'scissors', 'paper'] as Move[]).map((m) => {
                    const pot = potOf(result?.bets || [], m);
                    if (pot <= 0) return null;
                    const winnerMove = beatenBy[m];
                    const winnersExist = (result?.bets || []).some((b) => b.move === winnerMove);
                    return (
                      <div key={m} className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <span>{emojiOf(m)} {pot} монет</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span className="font-semibold text-slate-700">
                          {winnersExist ? `${emojiOf(winnerMove)} ${labelOf(winnerMove)}` : 'повернено'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={newRound}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
                >
                  <RefreshCw className="h-4 w-4" /> Новий раунд
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-5 text-center text-xs text-slate-400">
            Зароблені монети згодом можна буде витратити на послуги реабілітолога або вивести. Поки що — демо на віртуальних монетах.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PoolGame;
