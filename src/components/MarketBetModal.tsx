import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { placeBet } from '../lib/api';
import type { Market, Outcome, User } from '../lib/types';

function money(x: number) {
  return `${x.toFixed(2)} €`;
}

export function MarketBetModal(props: {
  market: Market;
  user: User | null;
  onClose: () => void;
  onPlaced: (amountTokens: number) => Promise<void> | void;
  onOptimisticBalance: (delta: number) => void;
}) {
  const [side, setSide] = useState<Outcome>('yes');
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const totalPool = props.market.yes_pool + props.market.no_pool;
  const participants = useMemo(() => {
    // MVP: we don't have bet_count yet; approximate by "active market" signal.
    return totalPool > 0 ? '—' : '0';
  }, [totalPool]);

  const minEur = 5;
  const commissionPct = 10;

  const needsLogin = !props.user;
  const isOpen = props.market.status === 'open';
  const canBet = !needsLogin && isOpen;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 tb-animate-in" onClick={props.onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-bg2/95 shadow-2xl backdrop-blur tb-animate-in">
        <div className="flex items-start justify-between gap-3 p-6">
          <div>
            <div className="text-2xl font-extrabold leading-tight">{props.market.title}</div>
            <div className="mt-2 text-sm text-white/60">{props.market.description}</div>
          </div>
          <button
            className="rounded-xl p-2 text-white/60 hover:bg-white/5 hover:text-white"
            onClick={props.onClose}
            type="button"
            aria-label="Fermer"
          >
            <X />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${isOpen ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-white/70'}`}>
              {isOpen ? 'OUVERT' : 'RÉSOLU'}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-white/80">MIN: {money(minEur)}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-white/80">COMM: {commissionPct}%</span>
          </div>

          <div className="mt-5">
            <div className="text-xs font-extrabold tracking-wide text-white/50">COTES EN TEMPS RÉEL</div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
              {totalPool <= 0 ? (
                <div>Aucune mise pour l'instant — les cotes apparaîtront dès le premier pari.</div>
              ) : (
                <div>
                  Pools: Oui {props.market.yes_pool} / Non {props.market.no_pool} — Prob Oui {Math.round(props.market.prob_yes * 100)}% / Non{' '}
                  {Math.round(props.market.prob_no * 100)}%
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-white/50">
              Min: {money(minEur)} · Pool: {money(totalPool)} · {participants} participants · Comm: {commissionPct}%
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-extrabold tracking-wide text-white/50">MON PRONOSTIC</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`rounded-2xl border px-4 py-4 text-center text-lg font-extrabold transition ${
                  side === 'yes' ? 'border-primary bg-primary/15 text-white' : 'border-white/10 bg-black/25 text-white/80 hover:bg-white/5'
                }`}
                onClick={() => setSide('yes')}
                disabled={!canBet}
              >
                OUI
              </button>
              <button
                type="button"
                className={`rounded-2xl border px-4 py-4 text-center text-lg font-extrabold transition ${
                  side === 'no' ? 'border-accent bg-accent/20 text-white' : 'border-white/10 bg-black/25 text-white/80 hover:bg-white/5'
                }`}
                onClick={() => setSide('no')}
                disabled={!canBet}
              >
                NON
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-accent/60 bg-accent/10 p-4">
            <div className="text-sm font-extrabold text-white/90">SIMULATEUR DE GAIN</div>
            <div className="mt-2 text-sm text-white/60">Soyez le premier à miser — les cotes s’afficheront !</div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-extrabold tracking-wide text-white/50">VALIDER MA MISE</div>
            {needsLogin ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Connecte-toi pour miser.{' '}
                <Link className="font-semibold text-primary hover:underline" to="/login">
                  Connexion
                </Link>
              </div>
            ) : null}
            {success ? (
              <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm tb-pop tb-glow">
                {success}
              </div>
            ) : null}
            {err ? <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm tb-pop">{err}</div> : null}

            <div className="mt-3 flex gap-3">
              <input
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:ring-2 focus:ring-accent/70 placeholder:text-white/30"
                placeholder="Montant (€)"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
                disabled={!canBet}
              />
              <Button
                className="h-12 px-6"
                disabled={!canBet || loading || Number(amount) < minEur}
                onClick={async () => {
                  setErr(null);
                  setSuccess(null);
                  setLoading(true);
                  const amt = Number(amount);
                  if (!amt || amt < minEur) {
                    setErr(`Mise minimum: ${minEur} jetons.`);
                    setLoading(false);
                    return;
                  }
                  // Optimistic wallet debit (before result)
                  props.onOptimisticBalance(-amt);
                  try {
                    await placeBet(props.market.id, side, amt);
                    setSuccess(`Pari validé : ${amt} jetons sur ${side === 'yes' ? 'OUI' : 'NON'}.`);
                    await props.onPlaced(amt);
                  } catch (e) {
                    // rollback
                    props.onOptimisticBalance(amt);
                    setErr(e instanceof Error ? e.message : String(e));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Miser →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

