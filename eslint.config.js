import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['dist/**', 'build/**', 'coverage/**', 'node_modules/**', '*.min.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    // O service worker roda noutro contexto: `self`, `caches` e `fetch` são
    // dele, não da janela. Ensinar isso ao ESLint é melhor do que silenciar
    // os avisos — assim um erro de verdade nesse arquivo continua aparecendo.
    files: ['public/sw.js'],
    languageOptions: { globals: globals.serviceworker },
  },
);
