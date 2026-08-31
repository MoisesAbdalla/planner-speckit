import { Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { AppShell } from './design/components/AppShell';
import { AuthForm } from './features/auth/components/AuthForm';
import { FinancePage } from './routes/Finance';
import { PlannerPage } from './routes/Planner';
import { isConfigured, missingConfigKeys } from './firebase';

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper">
      <p className="text-sm text-ink-soft">Carregando…</p>
    </div>
  );
}

/** Primeira execução sem `.env.local`: diz o que falta, em vez de tela branca. */
function SetupScreen() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <h1 className="text-2xl">Falta conectar ao Firebase</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Crie um arquivo <code className="figures text-ink">.env.local</code> na raiz do projeto com
        as chaves do seu projeto no Firebase. Você as encontra no console, em Configurações do
        projeto → Seus apps → Configuração do SDK.
      </p>

      <ul className="mt-4 rounded-md border border-rule bg-paper-raised p-4">
        {missingConfigKeys.map((key) => (
          <li key={key} className="figures py-0.5 text-sm text-ink">
            {key}=
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-ink-faint">
        Depois de salvar o arquivo, reinicie o servidor de desenvolvimento. O README tem o passo a
        passo completo.
      </p>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/financas" replace />;
  return <AuthForm />;
}

export default function App() {
  if (!isConfigured) return <SetupScreen />;

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/financas"
          element={
            <RequireAuth>
              <FinancePage />
            </RequireAuth>
          }
        />
        <Route
          path="/planner/:view"
          element={
            <RequireAuth>
              <PlannerPage />
            </RequireAuth>
          }
        />
        <Route path="/planner" element={<Navigate to="/planner/dia" replace />} />
        <Route path="/" element={<Navigate to="/financas" replace />} />
        <Route path="*" element={<Navigate to="/financas" replace />} />
      </Routes>
    </AuthProvider>
  );
}
