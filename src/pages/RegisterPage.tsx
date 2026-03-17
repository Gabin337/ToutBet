import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { register } from '../lib/api';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <Card className="w-full" title="Créer un compte">
        <div className="mb-4 text-sm text-white/70">MVP public (marchés ouverts).</div>
        <div className="space-y-3">
          <Input label="Email" value={email} onChange={setEmail} placeholder="vous@exemple.com" />
          <Input label="Mot de passe (min 8)" type="password" value={password} onChange={setPassword} />
          {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}
          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setErr(null);
              setLoading(true);
              try {
                await register(email, password);
                nav('/login');
              } catch (e) {
                setErr((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
          >
            <ShieldCheck size={16} /> Créer
          </Button>
          <div className="text-xs text-white/60">
            Déjà un compte ?{' '}
            <Link className="font-semibold text-primary hover:underline" to="/login">
              Se connecter
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

