import { describe, it, expect, beforeEach } from 'vitest';
import {
  readPreference,
  writePreference,
  resolveTheme,
  nextPreference,
  applyTheme,
  THEME_STORAGE_KEY,
  THEME_COLOR,
  type ThemePreference,
} from '../../src/design/theme';

/** Armazenamento de mentira, para não depender do ambiente do teste. */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  } as Storage;
}

/** Aba anônima e cookies bloqueados se comportam assim: tudo lança. */
function hostileStorage(): Storage {
  const boom = () => {
    throw new DOMException('bloqueado', 'SecurityError');
  };
  return {
    getItem: boom,
    setItem: boom,
    removeItem: boom,
    clear: boom,
    key: boom,
    get length(): number {
      return boom();
    },
  } as unknown as Storage;
}

describe('readPreference', () => {
  it('sem valor guardado, segue o sistema', () => {
    expect(readPreference(fakeStorage())).toBe('system');
  });

  it('devolve a preferência guardada', () => {
    expect(readPreference(fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark');
    expect(readPreference(fakeStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
  });

  it('valor desconhecido não quebra — cai no sistema', () => {
    expect(readPreference(fakeStorage({ [THEME_STORAGE_KEY]: 'roxo' }))).toBe('system');
    expect(readPreference(fakeStorage({ [THEME_STORAGE_KEY]: '' }))).toBe('system');
  });

  it('armazenamento bloqueado não lança (FR-007)', () => {
    expect(() => readPreference(hostileStorage())).not.toThrow();
    expect(readPreference(hostileStorage())).toBe('system');
  });

  it('sem armazenamento algum, segue o sistema', () => {
    expect(readPreference(undefined)).toBe('system');
  });
});

describe('writePreference', () => {
  it('guarda claro e escuro', () => {
    const storage = fakeStorage();
    writePreference('dark', storage);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    writePreference('light', storage);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('escolher "sistema" apaga a chave em vez de guardar o padrão', () => {
    const storage = fakeStorage({ [THEME_STORAGE_KEY]: 'dark' });
    writePreference('system', storage);
    expect(storage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('armazenamento bloqueado não lança (FR-007)', () => {
    expect(() => writePreference('dark', hostileStorage())).not.toThrow();
  });

  it('o que foi gravado é lido de volta', () => {
    const storage = fakeStorage();
    writePreference('dark', storage);
    expect(readPreference(storage)).toBe('dark');
  });
});

describe('resolveTheme', () => {
  it('preferência explícita ganha do sistema (FR-005)', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('sem preferência, segue o sistema (FR-002)', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('nextPreference', () => {
  it('percorre os três estados e volta ao começo', () => {
    expect(nextPreference('system')).toBe('light');
    expect(nextPreference('light')).toBe('dark');
    expect(nextPreference('dark')).toBe('system');
  });

  it('o ciclo completo volta ao ponto de partida', () => {
    let p: ThemePreference = 'system';
    for (let i = 0; i < 3; i += 1) p = nextPreference(p);
    expect(p).toBe('system');
  });
});

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.head.innerHTML = '<meta name="theme-color" content="#ffffff" />';
  });

  it('escreve o tema no elemento raiz', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sincroniza a cor da barra do navegador (FR-021)', () => {
    applyTheme('dark');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      THEME_COLOR.dark,
    );
    applyTheme('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      THEME_COLOR.light,
    );
  });

  it('não quebra quando a meta tag não existe', () => {
    document.head.innerHTML = '';
    expect(() => applyTheme('dark')).not.toThrow();
  });
});
