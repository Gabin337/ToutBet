import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { adminPending, adminResolve } from '../lib/api';
import type { Market } from '../lib/types';

export function AdminPage() {
  const [items, setItems] = useState<Market[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const load = async () => {
    setErr(null);
    try {
      setItems(await adminPending());
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-4">
      <Card title="Admin — Marchés non résolus">
        {err ? <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}
        <div className="grid gap-3">
          {items.map((m) => (
            <Card key={m.id} className="border-white/15">
              <div className="text-base font-bold">{m.title}</div>
              <div className="mt-1 text-sm text-white/70">{m.description}</div>
              <div className="mt-2 text-xs text-white/50">
                Pools: Oui {m.yes_pool} / Non {m.no_pool}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  disabled={loadingId === m.id}
                  onClick={async () => {
                    setLoadingId(m.id);
                    try {
                      await adminResolve(m.id, 'yes');
                      await load();
                    } catch (e) {
                      setErr((e as Error).message);
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                >
                  Clore & Résoudre: Oui
                </Button>
                <Button
                  variant="ghost"
                  disabled={loadingId === m.id}
                  onClick={async () => {
                    setLoadingId(m.id);
                    try {
                      await adminResolve(m.id, 'no');
                      await load();
                    } catch (e) {
                      setErr((e as Error).message);
                    } finally {
                      setLoadingId(null);
                    }
                  }}
                >
                  Clore & Résoudre: Non
                </Button>
              </div>
            </Card>
          ))}
          {items.length === 0 ? <div className="text-sm text-white/60">Aucun marché en attente.</div> : null}
        </div>
      </Card>
    </div>
  );
}

