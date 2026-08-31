import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import { useOnlineStatus } from '../../shared/connection';
import { SetupBanner } from './SetupBanner';

const NAV = [
  { to: '/planner/dia', label: 'Hoje', short: 'Hoje' },
  { to: '/financas', label: 'Finanças', short: 'Finanças' },
  { to: '/planner/mes', label: 'Planner', short: 'Planner' },
];

function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="border-b border-atencao/30 bg-atencao-wash px-4 py-2 text-center text-xs text-atencao"
    >
      Você está sem conexão. Pode continuar usando — as mudanças sobem quando a internet voltar.
    </div>
  );
}

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="currentColor" />
        <rect x="14" y="22" width="36" height="3.5" rx="1.75" fill="#FBF9F5" />
        <rect x="14" y="33" width="14" height="3.5" rx="1.75" fill="#FBF9F5" opacity="0.75" />
        <rect x="32" y="33" width="8" height="3.5" rx="1.75" fill="#FBF9F5" opacity="0.75" />
        <rect x="14" y="44" width="20" height="3.5" rx="1.75" fill="#4FA98F" />
      </svg>
      <span className="font-display text-lg font-semibold tracking-tight">Planner</span>
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-paper">
      <OfflineBanner />
      <SetupBanner />

      <div className="mx-auto flex w-full max-w-6xl">
        {/* Trilho lateral no desktop; no celular a navegação vive embaixo. */}
        <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-rule px-4 py-6 lg:flex">
          <div className="px-2 text-ink">
            <BrandMark />
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-acao-wash text-acao' : 'text-ink-soft hover:bg-paper-sunken'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-rule pt-4">
            <p className="truncate px-3 text-xs text-ink-faint">{user?.email}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 w-full rounded-sm px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper-sunken hover:text-ink"
            >
              Sair da conta
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-rule px-4 py-3 lg:hidden">
            <span className="text-ink">
              <BrandMark />
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-sm px-2 py-1 text-sm text-ink-soft hover:bg-paper-sunken hover:text-ink"
            >
              Sair
            </button>
          </header>

          <main className="px-4 pb-24 pt-4 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper-raised/95 backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-md">
          {NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-2 py-3 text-xs font-medium transition-colors ${
                    isActive ? 'text-acao' : 'text-ink-soft'
                  }`
                }
              >
                {item.short}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
