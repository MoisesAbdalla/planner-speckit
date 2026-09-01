/**
 * Preferência de tema — lógica pura, sem React.
 *
 * A preferência vive no aparelho, não na conta: claro no PC de dia e escuro
 * no celular à noite é o comportamento esperado, e sincronizar isso pela
 * conta criaria conflito entre dispositivos.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'planner:theme';

/** Ordem do ciclo do botão. Sistema é o começo porque é o padrão. */
const CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Lê a preferência guardada.
 *
 * Valor ausente, desconhecido ou armazenamento bloqueado (aba anônima,
 * cookies desativados) devolvem "system" — nunca um erro. Uma preferência de
 * aparência não pode derrubar o app.
 */
export function readPreference(storage: Storage | undefined = safeStorage()): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/** Grava a preferência. "system" remove a chave, em vez de guardar o padrão. */
export function writePreference(
  preference: ThemePreference,
  storage: Storage | undefined = safeStorage(),
): void {
  try {
    if (preference === 'system') storage?.removeItem(THEME_STORAGE_KEY);
    else storage?.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Sem armazenamento a escolha vale só nesta sessão. Melhor isso do que quebrar.
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** Junta a preferência com o tema do aparelho para chegar ao tema em uso. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): EffectiveTheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemPrefersDark ? 'dark' : 'light';
}

/** Próximo estado do botão: sistema → claro → escuro → sistema. */
export function nextPreference(current: ThemePreference): ThemePreference {
  const index = CYCLE.indexOf(current);
  return CYCLE[(index + 1) % CYCLE.length] ?? 'system';
}

export const PREFERENCE_LABEL: Record<ThemePreference, string> = {
  system: 'Sistema',
  light: 'Claro',
  dark: 'Escuro',
};

/** Cor da barra do navegador em cada tema — acompanha `--color-paper`. */
export const THEME_COLOR: Record<EffectiveTheme, string> = {
  light: '#fbf9f5',
  dark: '#000000',
};

/** Aplica o tema no documento. Único lugar que escreve `data-theme`. */
export function applyTheme(theme: EffectiveTheme, doc: Document = document): void {
  doc.documentElement.setAttribute('data-theme', theme);
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}
