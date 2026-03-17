import { Target, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import type { User } from '../lib/types';

export function Topbar(props: { user: User | null; onLogout: () => void }) {
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-bg2/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Target size={18} />
            </div>
            <div className="text-base font-extrabold tracking-tight">Toutbet'</div>
          </Link>
          {props.user ? (
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-extrabold text-white sm:flex">
              <Wallet size={16} className="text-primary" />
              {props.user.balance_tokens} <span className="text-white/60">jetons</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden text-xs text-white/60 sm:block">MVP</div>
          {props.user ? (
            <Button variant="ghost" onClick={props.onLogout}>
              Déconnexion
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

