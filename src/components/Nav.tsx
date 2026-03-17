import { CheckCircle, LogIn, Target, TrendingUp, User, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const linkBase =
  'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-white/5';

export function Nav(props: { isAdmin: boolean; authed: boolean }) {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${isActive ? 'bg-primary/15 text-white' : 'text-white/80'}`;
  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <NavLink to="/dashboard" className={cls}>
          <TrendingUp size={16} /> Marchés
        </NavLink>
        {props.authed ? (
          <>
            <NavLink to="/create-market" className={cls}>
              <Target size={16} /> Créer
            </NavLink>
            <NavLink to="/my-bets" className={cls}>
              <CheckCircle size={16} /> Mes paris
            </NavLink>
            <NavLink to="/profile" className={cls}>
              <User size={16} /> Profil
            </NavLink>
          </>
        ) : (
          <NavLink to="/login" className={cls}>
            <LogIn size={16} /> Connexion
          </NavLink>
        )}
      </div>
      {props.isAdmin ? (
        <div className="mt-2">
          <NavLink to="/admin" className={cls}>
            <Wallet size={16} /> Admin
          </NavLink>
        </div>
      ) : null}
    </div>
  );
}

