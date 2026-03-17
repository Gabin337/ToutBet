import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { MarketBetModal } from '../components/MarketBetModal';
import { listMarkets } from '../lib/api';
import type { Market, User } from '../lib/types';

export function DashboardPage(props: { user: User | null; onRefreshMe?: () => Promise<void> | void; onOptimisticBalance?: (delta: number) => void }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Market | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const subtitle = useMemo(() => {
    if (!lastUpdated) return null;
    return `Actualisé à ${lastUpdated.toLocaleTimeString()} — Rotation automatique des paris toutes les 5 min`;
  }, [lastUpdated]);

  useEffect(() => {
    const load = async () => {
      setErr(null);
      try {
        setMarkets(await listMarkets());
        setLastUpdated(new Date());
      } catch (e) {
        setErr((e as Error).message);
      }
    };
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">{subtitle}</div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5"
          onClick={async () => {
            try {
              setMarkets(await listMarkets());
              setLastUpdated(new Date());
            } catch (e) {
              setErr(e instanceof Error ? e.message : String(e));
            }
          }}
        >
          <RefreshCw size={14} /> Rafraîchir
        </button>
      </div>

      {!props.user ? (
        <Card>
          <div className="text-sm text-white/70">Mode invité: consulte les marchés, connecte-toi pour miser.</div>
        </Card>
      ) : null}

      {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {markets.map((m) => (
          <button key={m.id} type="button" className="text-left" onClick={() => setSelected(m)}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-6 shadow-xl transition hover:border-white/20">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />
              <div className="relative">
                <div className="text-lg font-extrabold leading-snug">{m.title}</div>
                <div className="mt-2 text-sm text-white/60">{m.description}</div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 text-center text-sm italic text-white/50">
                  Soyez le premier à parier !
                </div>
                <div className="mt-4 text-xs text-white/60">
                  Min: 5.00 € · Pool: {(m.yes_pool + m.no_pool).toFixed(2)} € · {m.yes_pool + m.no_pool > 0 ? '—' : '0'} participants · Comm: 10%
                </div>
              </div>
            </div>
          </button>
        ))}
        {markets.length === 0 ? (
          <Card>
            <div className="text-sm text-white/70">Aucun marché. Crée le premier.</div>
          </Card>
        ) : null}
      </div>

      {selected ? (
        <MarketBetModal
          market={selected}
          user={props.user}
          onClose={() => setSelected(null)}
          onOptimisticBalance={(d) => props.onOptimisticBalance?.(d)}
          onPlaced={async () => {
            setSelected(null);
            setMarkets(await listMarkets());
            setLastUpdated(new Date());
            await props.onRefreshMe?.();
          }}
        />
      ) : null}
    </div>
  );
}

