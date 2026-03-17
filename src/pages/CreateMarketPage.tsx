import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { createMarket } from '../lib/api';

export function CreateMarketPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  return (
    <div className="space-y-4">
      <Card title="Créer un marché (Oui/Non)">
        <div className="space-y-3">
          <Input label="Titre" value={title} onChange={setTitle} placeholder="Ex: Le PSG gagne ce weekend ?" />
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-white/70">Description</div>
            <textarea
              className="min-h-32 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/70 placeholder:text-white/30"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte + source + conditions de résolution."
            />
          </label>
          {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}
          <Button
            disabled={loading}
            onClick={async () => {
              setErr(null);
              setLoading(true);
              try {
                const m = await createMarket(title, description);
                nav(`/market/${m.id}`);
              } catch (e) {
                setErr((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Créer
          </Button>
        </div>
      </Card>
    </div>
  );
}

