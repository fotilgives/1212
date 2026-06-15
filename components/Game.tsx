import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, RefreshCw } from 'lucide-react';
import type { Wallet } from '../hooks/useWallet';

type Move = 'rock' | 'paper' | 'scissors';
type Outcome = 'win' | 'lose' | 'draw';

const MOVES: { id: Move; label: string; emoji: string }[] = [
  { id: 'rock', label: 'Камінь', emoji: '✊' },
  { id: 'scissors', label: 'Ножиці', emoji: '✌️' },
  { id: 'paper', label: 'Папір', emoji: '✋' },
];

const BETS = [10, 25, 50, 100];

const beats: Record<Move, Move> = { rock: 'scissors', scissors: 'paper', paper: 'rock' };

function decide(player: Move, house: Move): Outcome {
  if (player === house) return 'draw';
  return beats[player] === house ? 'win' : 'lose';
}

function emojiFor(move: Move) {
  return MOVES.find((m) => m.id === move)!.emoji;
}

interface Round {
  player: Move;
  house: Move;
  outcome: Outcome;
  delta: number;
}

interface Props {
  wallet: Wallet;
  onTopUp: () => void;
}

const Game: React.FC<Props> = ({ wallet, onTopUp }) => {
  const [bet, setBet] = useState(25);
  const [round, setRound] = useState<Round | null>(null);
  const [rolling, setRolling] = useState(false);

  const play = (player: Move) => {
    if (rolling) return;
    if (wallet.balance < bet) {
      onTopUp();
      return;
    }
    // Take the stake up front.
    wallet.withdraw(bet);
    setRolling(true);

    const house = MOVES[Math.floor(Math.random() * 3)].id;
    const outcome = decide(player, house);

    window.setTimeout(() => {
      let delta = -bet;
      if (outcome === 'win') {
        wallet.deposit(bet * 2);
        delta = bet;
      } else if (outcome === 'draw') {
        wallet.deposit(bet);
        delta = 0;
      }
      setRound({ player, house, outcome, delta });
      setRolling(false);
    }, 650);
  };

  return (
    <section id="game" className="mx-auto max-w-3xl px-5 py-14">
      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-md">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white px-6 py-4">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Камінь · Ножиці · Папір</h2>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            <Coins className="h-4 w-4" />
            {wallet.balance}
          </div>
        </div>

        <div className="p-6">
          {/* Arena */}
          <div className="grid grid-cols-3 items-center gap-2 rounded-2xl bg-slate-50 py-8 text-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ти</div>
              <div className="mt-2 text-5xl md:text-6xl">{round ? emojiFor(round.player) : '❔'}</div>
            </div>
            <div className="text-sm font-bold text-slate-300">VS</div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Суперник</div>
              <div className="mt-2 text-5xl md:text-6xl">
                {rolling ? (
                  <motion.span
                    animate={{ rotate: [0, -12, 12, 0] }}
                    transition={{ repeat: Infinity, duration: 0.4 }}
                    className="inline-block"
                  >
                    🤖
                  </motion.span>
                ) : round ? (
                  emojiFor(round.house)
                ) : (
                  '❔'
                )}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-4 h-12">
            <AnimatePresence mode="wait">
              {round && !rolling && (
                <motion.div
                  key={`${round.outcome}-${round.delta}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ${
                    round.outcome === 'win'
                      ? 'bg-emerald-50 text-emerald-700'
                      : round.outcome === 'lose'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {round.outcome === 'win' && `Перемога! +${round.delta} монет`}
                  {round.outcome === 'lose' && `Програш. −${Math.abs(round.delta)} монет`}
                  {round.outcome === 'draw' && 'Нічия — ставку повернено'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bet selector */}
          <div className="mt-2">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Ставка</div>
            <div className="flex flex-wrap gap-2">
              {BETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBet(b)}
                  className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    bet === b
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Coins className="h-3.5 w-3.5" />
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Moves */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {MOVES.map((m) => (
              <button
                key={m.id}
                disabled={rolling}
                onClick={() => play(m.id)}
                className="group flex flex-col items-center gap-1 rounded-2xl border border-slate-200 bg-white py-5 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="text-4xl transition group-hover:scale-110">{m.emoji}</span>
                <span className="text-sm font-semibold text-slate-700">{m.label}</span>
              </button>
            ))}
          </div>

          {wallet.balance < bet && (
            <button
              onClick={onTopUp}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100"
            >
              <RefreshCw className="h-4 w-4" />
              Недостатньо монет — поповнити баланс
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Game;
