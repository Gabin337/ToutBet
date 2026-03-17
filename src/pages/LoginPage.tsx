import { Eye, EyeOff, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { login, me } from '../lib/api';
import type { User } from '../lib/types';

export function LoginPage(props: { onAuthed: (u: User) => void }) {
  const [email, setEmail] = useState('admin@toutbet.com');
  const [password, setPassword] = useState('admin123');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
      <Card className="w-full" title="Connexion">
        <div className="mb-4 text-sm text-white/70">
          Bienvenue sur <span className="font-bold text-white">Toutbet'</span>.
        </div>
        <div className="space-y-3">
          <Input label="Email" value={email} onChange={setEmail} placeholder="vous@exemple.com" />
          <Input
            label="Mot de passe"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            right={
              <button
                type="button"
                className="text-white/60 hover:text-white"
                onClick={() => setShow((s) => !s)}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm">{err}</div> : null}
          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setErr(null);
              setLoading(true);
              try {
                await login(email, password);
                const u = await me();
                props.onAuthed(u);
                nav('/dashboard');
              } catch (e) {
                setErr(e instanceof Error ? e.message : String(e));
              } finally {
                setLoading(false);
              }
            }}
          >
            <Wallet size={16} /> Se connecter
          </Button>
          <div className="text-xs text-white/60">
            Pas de compte ?{' '}
            <Link className="font-semibold text-primary hover:underline" to="/register">
              Créer un compte
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

