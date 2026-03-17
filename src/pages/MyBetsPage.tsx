import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { myBets } from '../lib/api';
import type { MyBet } from '../lib/types';

export function MyBetsPage() {
  const [items, setItems] = useState<MyBet[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const { open, settled } = useMemo(() => {
    const o: MyBet[] = [];
    const s: MyBet[] = [];
    for (const it of items) {
      if (it.bet.settled) s.push(it);
      else o.push(it);
    }
    return { open: o, settled: s };
  }, [items]);

  useEffect(() => {
    const load = async () => {
      setErr(null);
      try {
        setItems(await myBets());
      } catch (e) {
        setErr((e as Error).message);
      }
    };
    void load();
  }, []);

  const row = (it: MyBet) => {
    const won = it.bet.won === true;
    const lost = it.bet.won === false;
    const pnl = it.bet.settled ? (it.bet.payout_tokens ?? 0) - it.bet.amount_tokens : -it.bet.amount_tokens;
    return (
      <Link key={it.bet.id} to={`/market/${it.market.id}`}>
        <Card
          className={`hover:border-white/20 hover:-translate-y-[1px] ${
            won ? 'border-green-500/20' : lost ? 'border-red-500/20' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-base font-bold">{it.market.title}</div>
              <div className="text-xs text-white/60">
                Pari: <span className="font-semibold">{it.bet.side === 'yes' ? 'Oui' : 'Non'}</span> — Mise:{' '}
                <span className="font-semibold">{it.bet.amount_tokens}</span>
              </div>
              <div className="mt-1 text-xs text-white/60">
                Statut:{' '}
                {it.bet.settled ? (
                  <span className={`${won ? 'text-green-300' : lost ? 'text-red-300' : 'text-white'} ${won || lost ? 'tb-pop' : ''}`}>
                    {won ? 'Gagné' : lost ? 'Perdu' : 'Terminé'}
                  </span>
                ) : (
                  <span className="text-white/70">En cours</span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-white/60">Gain / Perte</div>
              <div className={`text-sm font-extrabold ${pnl >= 0 ? 'text-green-300' : 'text-red-300'} ${it.bet.settled ? 'tb-pop' : ''}`}>
                {pnl >= 0 ? '+' : ''}
                {pnl} jetons
              </div>
              <div className="mt-1 text-xs text-white/50">
                {it.bet.settled ? `Payout: ${it.bet.payout_tokens ?? 0}` : '—'}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}

      <Card title="Paris en cours">
        <div className="grid gap-3">{open.length ? open.map(row) : <div className="text-sm text-white/60">Aucun.</div>}</div>
      </Card>

      <Card title="Paris terminés">
        <div className="grid gap-3">{settled.length ? settled.map(row) : <div className="text-sm text-white/60">Aucun.</div>}</div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-white/50">
        <CheckCircle size={14} className="text-green-300" /> gagné
        <XCircle size={14} className="text-red-300" /> perdu
      </div>
    </div>
  );
}

