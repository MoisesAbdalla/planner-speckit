import { useState } from 'react';
import { Button } from '../../../design/components/Button';
import { Input } from '../../../design/components/Field';
import { authErrorMessage, useAuth } from '../AuthContext';

interface PasswordResetProps {
  initialEmail?: string;
  onBack: () => void;
}

export function PasswordReset({ initialEmail = '', onBack }: PasswordResetProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">
          Enviamos um link de nova senha para <strong className="text-ink">{email}</strong>. Confira
          a caixa de entrada e o spam.
        </p>
        <Button variant="secondary" onClick={onBack}>
          Voltar para entrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        Digite o e-mail da sua conta. Enviamos um link para você criar uma nova senha.
      </p>

      <Input
        label="E-mail"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error ?? undefined}
      />

      <Button type="submit" disabled={sending}>
        {sending ? 'Enviando…' : 'Enviar link'}
      </Button>
      <Button variant="ghost" onClick={onBack}>
        Voltar
      </Button>
    </form>
  );
}
