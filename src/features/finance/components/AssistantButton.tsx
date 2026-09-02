import { useAssistant } from '../AssistantContext';

/**
 * O atalho para lançar por frase, presente em toda tela autenticada (FR-024).
 *
 * Duas formas, uma para cada navegação do app, para nunca competir com ela:
 * no celular uma pastilha **acima** da barra inferior, no desktop um item no
 * trilho lateral — porque o trilho já é a superfície de ação, e um botão
 * flutuante ali seria um segundo lugar para a mesma coisa.
 *
 * O glifo é a marca do app em miniatura: uma régua com uma linha começando.
 * Não um microfone (a voz é opcional e mora dentro do painel) nem uma faísca
 * de "IA", que não diz nada sobre o que o botão faz.
 */

function GlifoLinhaNova() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none">
      <path d="M3 15.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.5 11.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path
        d="M13.2 4.8l2 2-4.4 4.4-2.4.4.4-2.4 4.4-4.4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A pastilha do celular: acima da barra de navegação, nunca por cima dela. */
export function AssistantFab() {
  const assistente = useAssistant();
  if (!assistente) return null;

  return (
    <button
      type="button"
      onClick={() => assistente.setOpen(true)}
      // A barra inferior tem ~56px mais a área segura do aparelho; a pastilha
      // fica acima das duas, e por isso nunca a cobre.
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2 rounded-full border border-rule-strong bg-paper-raised px-4 py-3 text-sm font-medium text-ink shadow-raised transition-transform duration-[--ease-snap] ease-[--ease-out] active:scale-95 lg:hidden"
    >
      <GlifoLinhaNova />
      Lançar
    </button>
  );
}

/** A forma do desktop: mais um item do trilho, com o peso de ação primária. */
export function AssistantRailButton({ className = '' }: { className?: string }) {
  const assistente = useAssistant();
  if (!assistente) return null;

  return (
    <button
      type="button"
      onClick={() => assistente.setOpen(true)}
      className={`flex w-full items-center gap-2 rounded-sm border border-rule-strong px-3 py-2 text-sm font-medium text-ink transition-colors duration-[--ease-snap] hover:bg-paper-sunken ${className}`}
    >
      <GlifoLinhaNova />
      Lançar por frase
    </button>
  );
}
