import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Topbar } from './components/Topbar';
import { Nav } from './components/Nav';
import { access, logout, me, refresh } from './lib/api';
import { parseJwt } from './lib/auth';
import type { Role, User } from './lib/types';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateMarketPage } from './pages/CreateMarketPage';
import { MarketPage } from './pages/MarketPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyBetsPage } from './pages/MyBetsPage';
import { AdminPage } from './pages/AdminPage';

function RequireAuth(props: { children: JSX.Element }) {
  const token = access.getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  return props.children;
}

function RequireAdmin(props: { role: Role | null; children: JSX.Element }) {
  if (props.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return props.children;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const location = useLocation();

  const authed = useMemo(() => !!access.getAccessToken(), []);

  const syncMe = async () => {
    try {
      if (!access.getAccessToken()) {
        await refresh();
      }
      const u = await me();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  const applyBalanceDelta = (delta: number) => {
    setUser((u) => {
      if (!u) return u;
      return { ...u, balance_tokens: u.balance_tokens + delta };
    });
  };

  useEffect(() => {
    const token = access.getAccessToken();
    const p = token ? parseJwt(token) : null;
    setRole((p?.role as Role) ?? null);
  }, [location.pathname]);

  useEffect(() => {
    void syncMe();
  }, [authed]);

  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => {
      void syncMe();
    }, 5000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isAuthRoute = ['/login', '/register'].includes(location.pathname);
  const showTopbar = true;
  const showNav = !isAuthRoute;

  return (
    <div className="min-h-screen">
      {showTopbar ? (
        <Topbar
          user={user}
          onLogout={() => {
            void logout().catch(() => {});
            setUser(null);
            setRole(null);
          }}
        />
      ) : null}
      {showNav ? (
        <div className="py-3">
          <Nav isAdmin={role === 'admin'} authed={!!user} />
        </div>
      ) : null}
      <div className="mx-auto max-w-5xl px-4 pb-10">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage onAuthed={setUser} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <DashboardPage user={user} onRefreshMe={syncMe} onOptimisticBalance={applyBalanceDelta} />
            }
          />
          <Route
            path="/market/:id"
            element={
              <MarketPage user={user} onAfterBet={syncMe} />
            }
          />
          <Route
            path="/create-market"
            element={
              <RequireAuth>
                <CreateMarketPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage user={user} onUser={setUser} />
              </RequireAuth>
            }
          />
          <Route
            path="/my-bets"
            element={
              <RequireAuth>
                <MyBetsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <RequireAdmin role={role}>
                  <AdminPage />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

