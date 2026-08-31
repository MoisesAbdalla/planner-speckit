import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

/**
 * Harness das Security Rules (Princípio II).
 *
 * Exige o emulador do Firestore rodando:
 *   firebase emulators:start --only firestore
 */
export const PROJECT_ID = 'planner-rules-test';

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

/** Movimentação válida — os testes partem daqui e quebram um campo por vez. */
export function validTransaction(overrides: Record<string, unknown> = {}) {
  return {
    type: 'expense',
    amountCents: 5000,
    description: 'Mercado',
    categoryId: 'cat-alimentacao',
    date: '2026-08-29',
    month: '2026-08',
    status: 'confirmed',
    source: 'manual',
    recurrenceId: null,
    ...overrides,
  };
}

export function validRecurrence(overrides: Record<string, unknown> = {}) {
  return {
    type: 'expense',
    amountCents: 120000,
    description: 'Aluguel',
    categoryId: 'cat-moradia',
    dayOfMonth: 5,
    startMonth: '2026-08',
    endMonth: null,
    ...overrides,
  };
}

export function validCategory(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Alimentação',
    kind: 'expense',
    color: '#1F6F5C',
    isDefault: true,
    archived: false,
    sortOrder: 0,
    ...overrides,
  };
}

export function validTask(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Estudar inglês',
    notes: null,
    time: '19:00',
    recurrence: null,
    date: '2026-08-29',
    startDate: '2026-08-29',
    endDate: null,
    ...overrides,
  };
}
