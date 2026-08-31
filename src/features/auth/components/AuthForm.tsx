import { useState } from 'react';
import { Button } from '../../../design/components/Button';
import { Input } from '../../../design/components/Field';
import { authErrorMessage, useAuth } from '../AuthContext';
import { PasswordReset } from './PasswordReset';
import { SetupBanner } from '../../../design/components/SetupBanner';

type Mode = 'signin' | 'signup' | 'reset';

export function AuthForm() {
  const { signIn, signUp, signInGoogle, redirectError } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await signUp(name, email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      // Em falha nada é limpo: os campos continuam preenchidos.
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInGoogle();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <SetupBanner />
      <div className="mb-8">
        <svg viewBox="0 0 64 64" className="mb-5 h-11 w-11 text-ink" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="currentColor" />
          <rect x="14" y="22" width="36" height="3.5" rx="1.75" fill="#FBF9F5" />
          <rect x="14" y="33" width="14" height="3.5" rx="1.75" fill="#FBF9F5" opacity="0.75" />
          <rect x="32" y="33" width="8" height="3.5" rx="1.75" fill="#FBF9F5" opacity="0.75" />
          <rect x="14" y="44" width="20" height="3.5" rx="1.75" fill="#4FA98F" />
        </svg>

        <h1 className="text-3xl">
          {mode === 'signup'
            ? 'Criar sua conta'
            : mode === 'reset'
              ? 'Recuperar senha'
              : 'Sua rotina e seu dinheiro'}
        </h1>
        {mode === 'signin' && (
          <p className="mt-2 text-sm text-ink-soft">
            No computador e no celular, sempre com os mesmos dados.
          </p>
        )}
      </div>

      {mode === 'reset' ? (
        <PasswordReset initialEmail={email} onBack={() => setMode('signin')} />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <Input
                label="Como podemos te chamar"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Senha"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              hint={mode === 'signup' ? 'Pelo menos 6 caracteres.' : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error ?? undefined}
            />

            <Button type="submit" disabled={busy}>
              {busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-rule" />
            <span className="text-xs text-ink-faint">ou</span>
            <span className="h-px flex-1 bg-rule" />
          </div>

          <Button variant="secondary" onClick={handleGoogle} disabled={busy}>
            Continuar com Google
          </Button>

          {redirectError && (
            <p role="alert" className="mt-3 text-sm text-saida">
              {redirectError}
            </p>
          )}

          <div className="mt-6 flex flex-col items-center gap-2 text-sm">
            <button
              type="button"
              className="text-acao hover:underline"
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setError(null);
              }}
            >
              {mode === 'signup' ? 'Já tenho conta' : 'Criar uma conta'}
            </button>
            {mode === 'signin' && (
              <button
                type="button"
                className="text-ink-soft hover:text-ink hover:underline"
                onClick={() => setMode('reset')}
              >
                Esqueci minha senha
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
