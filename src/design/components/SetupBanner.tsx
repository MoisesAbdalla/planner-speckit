import { useAuth } from '../../features/auth/AuthContext';

/**
 * Avisa quando falta uma etapa de configuração do Firebase.
 *
 * O app continua utilizável: o aviso diz o próximo passo em vez de esconder o
 * problema num console que ninguém abre.
 */
export function SetupBanner() {
  const { setupError, dismissSetupError } = useAuth();
  if (!setupError) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-atencao/30 bg-atencao-wash px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-atencao">Falta um passo na configuração</p>
        <p className="mt-0.5 text-xs text-ink-soft">{setupError}</p>
      </div>
      <button
        type="button"
        onClick={dismissSetupError}
        aria-label="Dispensar aviso"
        className="shrink-0 rounded-sm px-2 py-1 text-ink-soft hover:bg-atencao/10 hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
