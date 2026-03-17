import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { getMarket, placeBet } from '../lib/api';
import type { Market, Outcome, User } from '../lib/types';

function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

export function MarketPage(props: { user: User | null; onAfterBet?: () => void | Promise<void> }) {
  const { id } = useParams();
  const marketId = Number(id);
  const [m, setM] = useState<Market | null>(null);
  const [side, setSide] = useState<Outcome>('yes');
  const [amount, setAmount] = useState('10');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwn = useMemo(() => (m && props.user ? m.creator_id === props.user.id : false), [m, props.user]);
  const needsLogin = !props.user;

  useEffect(() => {
    const load = async () => {
      setErr(null);
      try {
        setM(await getMarket(marketId));
      } catch (e) {
        setErr((e as Error).message);
      }
    };
    void load();
  }, [marketId]);

  return (
    <div className="space-y-4">
      {m ? (
        <Card>
          <div className="text-xl font-extrabold">{m.title}</div>
          <div className="mt-1 text-sm text-white/70">{m.description}</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/60">Oui</div>
              <div className="text-lg font-bold">{pct(m.prob_yes)}</div>
              <div className="text-xs text-white/50">Pool: {m.yes_pool}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
              <div className="text-xs text-white/60">Non</div>
              <div className="text-lg font-bold">{pct(m.prob_no)}</div>
              <div className="text-xs text-white/50">Pool: {m.no_pool}</div>
            </div>
          </div>
          {m.status === 'resolved' ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
              Marché résolu: <span className="font-bold">{m.resolved_outcome === 'yes' ? 'Oui' : 'Non'}</span>
            </div>
          ) : null}
        </Card>
      ) : null}

      {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}
      {ok ? <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">{ok}</div> : null}

      <Card title="Placer un pari">
        <div className="space-y-3">
          {needsLogin ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              Connecte-toi pour parier et accéder au wallet.{' '}
              <Link className="font-semibold text-primary hover:underline" to="/login">
                Connexion
              </Link>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={side === 'yes' ? 'primary' : 'ghost'}
              onClick={() => setSide('yes')}
              disabled={m?.status !== 'open' || needsLogin}
            >
              <CheckCircle size={16} /> Oui
            </Button>
            <Button
              variant={side === 'no' ? 'primary' : 'ghost'}
              onClick={() => setSide('no')}
              disabled={m?.status !== 'open' || needsLogin}
            >
              <XCircle size={16} /> Non
            </Button>
          </div>
          <Input label="Montant (jetons)" value={amount} onChange={setAmount} />
          <div className="text-xs text-white/60">
            {isOwn ? <span className="text-red-300">Interdit: tu ne peux pas parier sur ton propre marché.</span> : null}
          </div>
          <Button
            disabled={needsLogin || loading || !m || m.status !== 'open' || isOwn}
            onClick={async () => {
              if (!m) return;
              setErr(null);
              setOk(null);
              setLoading(true);
              try {
                await placeBet(m.id, side, Number(amount));
                setOk('Pari placé.');
                setM(await getMarket(m.id));
                await props.onAfterBet?.();
              } catch (e) {
                setErr((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Valider
          </Button>
        </div>
      </Card>
    </div>
  );
}

