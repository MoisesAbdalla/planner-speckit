import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  createTestEnv,
  validTransaction,
  validRecurrence,
  validCategory,
  validTask,
} from './setup';

/** As regras são a última linha de defesa: o formulário pode ser contornado. */
describe('validação de shape nas regras', () => {
  let env: RulesTestEnvironment;
  const UID = 'uid-ana';

  beforeAll(async () => {
    env = await createTestEnv();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  beforeEach(async () => {
    await env.clearFirestore();
  });

  const dbAsUser = () => env.authenticatedContext(UID).firestore();
  const txRef = (db: ReturnType<typeof dbAsUser>, id = 'tx') =>
    doc(db, 'users', UID, 'transactions', id);

  describe('movimentações', () => {
    it('aceita uma movimentação bem formada', async () => {
      await assertSucceeds(setDoc(txRef(dbAsUser()), validTransaction()));
    });

    it('rejeita valor zero (FR-011)', async () => {
      await assertFails(setDoc(txRef(dbAsUser()), validTransaction({ amountCents: 0 })));
    });

    it('rejeita valor negativo (FR-011)', async () => {
      await assertFails(setDoc(txRef(dbAsUser()), validTransaction({ amountCents: -100 })));
    });

    it('rejeita valor fracionário — dinheiro é centavo inteiro', async () => {
      await assertFails(setDoc(txRef(dbAsUser()), validTransaction({ amountCents: 50.5 })));
    });

    it('rejeita month que não bate com a data', async () => {
      await assertFails(
        setDoc(txRef(dbAsUser()), validTransaction({ date: '2026-08-29', month: '2026-07' })),
      );
    });

    it('rejeita data fora do formato YYYY-MM-DD', async () => {
      await assertFails(
        setDoc(txRef(dbAsUser()), validTransaction({ date: '29/08/2026', month: '2026-08' })),
      );
    });

    it('rejeita tipo desconhecido', async () => {
      await assertFails(setDoc(txRef(dbAsUser()), validTransaction({ type: 'transferencia' })));
    });

    it('rejeita status desconhecido', async () => {
      await assertFails(setDoc(txRef(dbAsUser()), validTransaction({ status: 'talvez' })));
    });

    it('rejeita origem "recurrence" sem o vínculo da recorrência', async () => {
      await assertFails(
        setDoc(txRef(dbAsUser()), validTransaction({ source: 'recurrence', recurrenceId: null })),
      );
    });

    it('aceita origem "recurrence" com o vínculo preenchido', async () => {
      await assertSucceeds(
        setDoc(
          txRef(dbAsUser(), 'rec_abc_2026-08'),
          validTransaction({ source: 'recurrence', recurrenceId: 'abc', status: 'planned' }),
        ),
      );
    });

    it('rejeita descrição vazia', async () => {
      await assertFails(setDoc(txRef(dbAsUser()), validTransaction({ description: '' })));
    });
  });

  describe('recorrências', () => {
    const recRef = () => doc(dbAsUser(), 'users', UID, 'recurrences', 'rec');

    it('aceita uma recorrência bem formada', async () => {
      await assertSucceeds(setDoc(recRef(), validRecurrence()));
    });

    it('rejeita dia do mês fora de 1–31', async () => {
      await assertFails(setDoc(recRef(), validRecurrence({ dayOfMonth: 0 })));
      await assertFails(setDoc(recRef(), validRecurrence({ dayOfMonth: 32 })));
    });

    it('aceita encerramento com mês válido', async () => {
      await assertSucceeds(setDoc(recRef(), validRecurrence({ endMonth: '2026-12' })));
    });

    it('rejeita endMonth fora do formato YYYY-MM', async () => {
      await assertFails(setDoc(recRef(), validRecurrence({ endMonth: 'dezembro' })));
    });
  });

  describe('categorias', () => {
    const catRef = () => doc(dbAsUser(), 'users', UID, 'categories', 'cat');

    it('aceita uma categoria bem formada', async () => {
      await assertSucceeds(setDoc(catRef(), validCategory()));
    });

    it('nega exclusão — categoria é arquivada para preservar o histórico', async () => {
      await env.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', UID, 'categories', 'cat'), validCategory());
      });
      await assertFails(deleteDoc(catRef()));
    });

    it('aceita arquivar', async () => {
      await assertSucceeds(setDoc(catRef(), validCategory({ archived: true })));
    });

    it('rejeita kind desconhecido', async () => {
      await assertFails(setDoc(catRef(), validCategory({ kind: 'investimento' })));
    });
  });

  describe('tarefas e exceções', () => {
    it('aceita uma tarefa bem formada', async () => {
      await assertSucceeds(setDoc(doc(dbAsUser(), 'users', UID, 'tasks', 't1'), validTask()));
    });

    it('rejeita tarefa sem título', async () => {
      await assertFails(
        setDoc(doc(dbAsUser(), 'users', UID, 'tasks', 't1'), validTask({ title: '' })),
      );
    });

    it('exige que o id do override case com taskId e data', async () => {
      const db = dbAsUser();
      await assertSucceeds(
        setDoc(doc(db, 'users', UID, 'taskOverrides', 't1_2026-08-29'), {
          taskId: 't1',
          date: '2026-08-29',
          done: true,
          deleted: false,
        }),
      );
      await assertFails(
        setDoc(doc(db, 'users', UID, 'taskOverrides', 'id-qualquer'), {
          taskId: 't1',
          date: '2026-08-29',
          done: true,
          deleted: false,
        }),
      );
    });
  });

  describe('agregados mensais', () => {
    it('aceita agregado com inteiros não negativos', async () => {
      await assertSucceeds(
        setDoc(doc(dbAsUser(), 'users', UID, 'monthStats', '2026-08'), {
          incomeCents: 500000,
          expenseCents: 320000,
        }),
      );
    });

    it('rejeita agregado negativo', async () => {
      await assertFails(
        setDoc(doc(dbAsUser(), 'users', UID, 'monthStats', '2026-08'), {
          incomeCents: -1,
          expenseCents: 0,
        }),
      );
    });

    it('rejeita id de mês fora do formato', async () => {
      await assertFails(
        setDoc(doc(dbAsUser(), 'users', UID, 'monthStats', 'agosto'), {
          incomeCents: 0,
          expenseCents: 0,
        }),
      );
    });
  });
});
