import { LogOut, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { fund, logout } from '../lib/api';
import type { User } from '../lib/types';

export function ProfilePage(props: { user: User | null; onUser: (u: User | null) => void }) {
  const [amount, setAmount] = useState('50');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  return (
    <div className="space-y-4">
      <Card title="Profil">
        <div className="text-sm text-white/70">Email</div>
        <div className="text-base font-bold">{props.user?.email ?? '-'}</div>
        <div className="mt-2 text-sm text-white/70">Rôle</div>
        <div className="text-base font-bold">{props.user?.role ?? 'user'}</div>
      </Card>

      <Card title="Solde & approvisionnement mock">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/60">Solde</div>
            <div className="text-2xl font-extrabold">{props.user?.balance_tokens ?? 0} jetons</div>
          </div>
          <div className="rounded-2xl bg-primary/15 p-3 text-primary">
            <Wallet />
          </div>
        </div>
        <div className="space-y-3">
          <Input label="Montant (€ => jetons)" value={amount} onChange={setAmount} />
          {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}
          {ok ? <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">{ok}</div> : null}
          <Button
            disabled={loading}
            onClick={async () => {
              setErr(null);
              setOk(null);
              setLoading(true);
              try {
                const u = await fund(Number(amount));
                props.onUser(u);
                setOk('Approvisionnement effectué.');
              } catch (e) {
                setErr((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          >
            Créditer
          </Button>
        </div>
      </Card>

      <Card title="Session">
        <Button
          variant="ghost"
          onClick={async () => {
            await logout().catch(() => {});
            props.onUser(null);
            nav('/login');
          }}
        >
          <LogOut size={16} /> Se déconnecter
        </Button>
      </Card>
    </div>
  );
}

