import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyTheme,
  nextPreference,
  readPreference,
  resolveTheme,
  writePreference,
  type EffectiveTheme,
  type ThemePreference,
} from './theme';

interface ThemeValue {
  /** O que a pessoa escolheu: claro, escuro ou seguir o sistema. */
  preference: ThemePreference;
  /** O tema que está de fato na tela. */
  theme: EffectiveTheme;
  setPreference: (preference: ThemePreference) => void;
  cyclePreference: () => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof matchMedia !== 'function') return false;
  return matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // O script do index.html já pintou a tela no tema certo; aqui só assumimos
  // o controle a partir do mesmo estado, sem recalcular nada visível.
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readPreference());
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  const theme = resolveTheme(preference, systemDark);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Enquanto a escolha for "seguir o sistema", o app acompanha o aparelho
  // trocando de tema com o app aberto — o modo escuro automático ao anoitecer
  // é exatamente esse caso (FR-006).
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writePreference(next);
  }, []);

  const value = useMemo<ThemeValue>(
    () => ({
      preference,
      theme,
      setPreference,
      cyclePreference: () => setPreference(nextPreference(preference)),
    }),
    [preference, theme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme precisa estar dentro de <ThemeProvider>.');
  return value;
}
