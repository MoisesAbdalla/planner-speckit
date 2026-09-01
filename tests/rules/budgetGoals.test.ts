import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { createTestEnv } from './setup';

/**
 * Regras da subcoleção de metas.
 *
 * Nota deliberada: **não há teste de valor negativo aqui**. As regras do
 * Firestore não iteram listas, então o valor de cada versão não é
 * inspecionável nesta camada — essa garantia é do app e vive em
 * tests/unit/goals.test.ts. Um teste que promete o que a camada não entrega
 * é pior do que teste nenhum.
 */
describe('regras das metas de orçamento', () => {
  let env: RulesTestEnvironment;
  const ANA = 'uid-ana';
  const BRUNO = 'uid-bruno';

  const metaCategoria = (overrides: Record<string, unknown> = {}) => ({
    target: 'category',
    categoryId: 'cat-alimentacao',
    versions: [{ from: '2026-09', amountCents: 80000 }],
    overrides: {},
    ...overrides,
  });

  const metaGeral = (overrides: Record<string, unknown> = {}) => ({
    target: 'overall',
    categoryId: null,
    versions: [{ from: '2026-09', amountCents: 500000 }],
    overrides: {},
    ...overrides,
  });

  beforeAll(async () => {
    env = await createTestEnv();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  beforeEach(async () => {
    await env.clearFirestore();
  });

  const asAna = () => env.authenticatedContext(ANA).firestore();
  const goalRef = (db: ReturnType<typeof asAna>, alvo: string, uid = ANA) =>
    doc(db, 'users', uid, 'budgetGoals', alvo);

  describe('isolamento entre contas', () => {
    it('a dona grava e lê a própria meta', async () => {
      const ana = asAna();
      await assertSucceeds(setDoc(goalRef(ana, 'overall'), metaGeral()));
      await assertSucceeds(getDoc(goalRef(ana, 'overall')));
    });

    it('outro usuário não lê a meta da Ana', async () => {
      await env.withSecurityRulesDisabled(async (context) => {
        await setDoc(
          doc(context.firestore(), 'users', ANA, 'budgetGoals', 'overall'),
          metaGeral(),
        );
      });
      const bruno = env.authenticatedContext(BRUNO).firestore();
      await assertFails(getDoc(goalRef(bruno, 'overall')));
    });

    it('outro usuário não grava meta na conta da Ana', async () => {
      const bruno = env.authenticatedContext(BRUNO).firestore();
      await assertFails(setDoc(goalRef(bruno, 'overall'), metaGeral()));
    });

    it('visitante sem login não acessa nada', async () => {
      const anonimo = env.unauthenticatedContext().firestore();
      await assertFails(getDoc(goalRef(anonimo, 'overall')));
      await assertFails(setDoc(goalRef(anonimo, 'overall'), metaGeral()));
    });
  });

  describe('coerência entre o alvo e o id do documento', () => {
    it('aceita meta de categoria cujo id bate com a categoria', async () => {
      await assertSucceeds(setDoc(goalRef(asAna(), 'cat-alimentacao'), metaCategoria()));
    });

    it('rejeita meta de categoria gravada com outro id', async () => {
      await assertFails(setDoc(goalRef(asAna(), 'cat-outra'), metaCategoria()));
    });

    it('rejeita meta geral gravada fora do id "overall"', async () => {
      await assertFails(setDoc(goalRef(asAna(), 'cat-alimentacao'), metaGeral()));
    });

    it('rejeita alvo desconhecido', async () => {
      await assertFails(
        setDoc(goalRef(asAna(), 'overall'), metaGeral({ target: 'semana' })),
      );
    });
  });

  describe('formato', () => {
    it('rejeita meta sem nenhuma versão', async () => {
      await assertFails(setDoc(goalRef(asAna(), 'overall'), metaGeral({ versions: [] })));
    });

    it('rejeita versions que não é lista', async () => {
      await assertFails(
        setDoc(goalRef(asAna(), 'overall'), metaGeral({ versions: 'nenhuma' })),
      );
    });

    it('rejeita overrides que não é mapa', async () => {
      await assertFails(
        setDoc(goalRef(asAna(), 'overall'), metaGeral({ overrides: [] })),
      );
    });

    it('aceita overrides preenchido', async () => {
      await assertSucceeds(
        setDoc(goalRef(asAna(), 'overall'), metaGeral({ overrides: { '2026-12': 700000 } })),
      );
    });

    it('aceita várias versões — é o histórico da meta', async () => {
      await assertSucceeds(
        setDoc(
          goalRef(asAna(), 'overall'),
          metaGeral({
            versions: [
              { from: '2026-01', amountCents: 400000 },
              { from: '2026-09', amountCents: 500000 },
            ],
          }),
        ),
      );
    });
  });

  describe('remoção', () => {
    it('a dona apaga a própria meta', async () => {
      const ana = asAna();
      await assertSucceeds(setDoc(goalRef(ana, 'overall'), metaGeral()));
      await assertSucceeds(
        import('firebase/firestore').then(({ deleteDoc }) =>
          deleteDoc(goalRef(ana, 'overall')),
        ),
      );
    });
  });
});
