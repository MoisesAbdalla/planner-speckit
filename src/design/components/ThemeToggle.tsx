import { useTheme } from '../ThemeProvider';
import { PREFERENCE_LABEL, type ThemePreference } from '../theme';

/**
 * Controle de tema: um botão que percorre sistema → claro → escuro.
 *
 * Um botão só, em vez de um menu, porque a escolha tem três estados e é
 * reversível num toque — abrir um menu para isso custaria mais interações do
 * que a decisão merece (FR-018).
 */

function Icon({ preference }: { preference: ThemePreference }) {
  if (preference === 'light') {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="currentColor">
        <circle cx="8" cy="8" r="3.2" />
        <path
          d="M8 .8v2M8 13.2v2M.8 8h2M13.2 8h2M2.9 2.9l1.4 1.4M11.7 11.7l1.4 1.4M13.1 2.9l-1.4 1.4M4.3 11.7l-1.4 1.4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (preference === 'dark') {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true" fill="currentColor">
        <path d="M13.5 10.4A6 6 0 0 1 5.6 2.5a6 6 0 1 0 7.9 7.9Z" />
      </svg>
    );
  }

  // Sistema: meio sol, meia lua — a decisão não é sua, é do aparelho.
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 2.8a5.2 5.2 0 0 1 0 10.4Z" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { preference, cyclePreference } = useTheme();

  return (
    <button
      type="button"
      onClick={cyclePreference}
      // O rótulo diz o estado atual e o que o toque faz — quem usa leitor de
      // tela não enxerga o ícone mudar.
      aria-label={`Tema: ${PREFERENCE_LABEL[preference]}. Tocar para alternar.`}
      title={`Tema: ${PREFERENCE_LABEL[preference]}`}
      className={`inline-flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink-soft transition-colors hover:bg-paper-sunken hover:text-ink ${className}`}
    >
      <Icon preference={preference} />
      <span className="sr-only sm:not-sr-only">{PREFERENCE_LABEL[preference]}</span>
    </button>
  );
}
