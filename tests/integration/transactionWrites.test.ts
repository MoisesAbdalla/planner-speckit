import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../src/firebase';
import {
  createTransaction,
  confirmTransaction,
  deleteTransaction,
} from '../../src/features/finance/lib/transactionWrites';
import { materializeMonth } from '../../src/features/finance/lib/materializeRecurrences';
import type { Recurrence, Transaction, TransactionDraft } from '../../src/features/finance/types';

/**
 * Percurso real de escrita, contra os emuladores, passando pelas Security
 * Rules de produção. Responde a uma pergunta concreta: o lançamento cai mesmo
 * em users/{uid}/transactions, e o agregado do mês acompanha?
 */

let uid: string;

const gasto = (overrides: Partial<TransactionDraft> = {}): TransactionDraft => ({
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
});

beforeAll(async () => {
  const email = `teste-${Date.now()}@exemplo.com`;
  const credential = await createUserWithEmailAndPassword(auth, email, 'senha-de-teste');
  uid = credential.user.uid;
});

afterAll(async () => {
  await signOut(auth);
});

describe('onde o lançamento é gravado', () => {
  it('grava em users/{uid}/transactions — subcoleção, não raiz', async () => {
    const id = await createTransaction(uid, gasto());

    const salvo = await getDoc(doc(db, 'users', uid, 'transactions', id));
    expect(salvo.exists()).toBe(true);
    expect(salvo.ref.path).toBe(`users/${uid}/transactions/${id}`);

    const dados = salvo.data() as Transaction;
    expect(dados.amountCents).toBe(5000);
    expect(dados.month).toBe('2026-08');
    expect(dados.status).toBe('confirmed');
  });

  it('atualiza o agregado do mês na mesma escrita', async () => {
    await createTransaction(uid, gasto({ amountCents: 12345, description: 'Farmácia' }));

    const stats = await getDoc(doc(db, 'users', uid, 'monthStats', '2026-08'));
    expect(stats.exists()).toBe(true);
    expect(stats.data()!.expenseCents).toBeGreaterThanOrEqual(12345);
  });

  it('o agregado soma com increment, sem perder escritas simultâneas', async () => {
    const antes = (await getDoc(doc(db, 'users', uid, 'monthStats', '2026-09'))).data();
    const base = antes?.expenseCents ?? 0;

    // Cinco gravações disparadas juntas, como dois aparelhos ao mesmo tempo.
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createTransaction(uid, gasto({ amountCents: 1000, date: '2026-09-10', month: '2026-09', description: `Item ${i}` })),
      ),
    );

    const depois = await getDoc(doc(db, 'users', uid, 'monthStats', '2026-09'));
    expect(depois.data()!.expenseCents).toBe(base + 5000);
  });

  it('confirmar um previsto move o valor para o saldo real', async () => {
    const id = await createTransaction(
      uid,
      gasto({ status: 'planned', date: '2026-10-05', month: '2026-10', amountCents: 120000 }),
    );

    const semConfirmar = await getDoc(doc(db, 'users', uid, 'monthStats', '2026-10'));
    expect(semConfirmar.data()?.expenseCents ?? 0).toBe(0);

    const tx = { id, ...(await getDoc(doc(db, 'users', uid, 'transactions', id))).data() } as Transaction;
    await confirmTransaction(uid, tx);

    const confirmado = await getDoc(doc(db, 'users', uid, 'monthStats', '2026-10'));
    expect(confirmado.data()!.expenseCents).toBe(120000);
  });

  it('excluir devolve o valor ao agregado', async () => {
    const id = await createTransaction(
      uid,
      gasto({ date: '2026-11-03', month: '2026-11', amountCents: 7700 }),
    );
    const tx = { id, ...(await getDoc(doc(db, 'users', uid, 'transactions', id))).data() } as Transaction;

    await deleteTransaction(uid, tx);

    expect((await getDoc(doc(db, 'users', uid, 'transactions', id))).exists()).toBe(false);
    expect((await getDoc(doc(db, 'users', uid, 'monthStats', '2026-11'))).data()!.expenseCents).toBe(0);
  });
});

describe('recorrência materializada', () => {
  it('cria o previsto com id determinístico e não duplica ao repetir', async () => {
    const recorrencia: Recurrence = {
      id: 'aluguel',
      type: 'expense',
      amountCents: 120000,
      description: 'Aluguel',
      categoryId: 'cat-moradia',
      dayOfMonth: 5,
      startMonth: '2026-12',
      endMonth: null,
    };

    const criados = await materializeMonth(uid, [recorrencia], '2026-12');
    expect(criados).toBe(1);

    const previsto = await getDoc(doc(db, 'users', uid, 'transactions', 'rec_aluguel_2026-12'));
    expect(previsto.exists()).toBe(true);
    expect(previsto.data()!.status).toBe('planned');

    // Rodar de novo (outro aparelho abrindo o mesmo mês) não pode duplicar.
    expect(await materializeMonth(uid, [recorrencia], '2026-12')).toBe(0);

    const doMes = await getDocs(collection(db, 'users', uid, 'transactions'));
    const deDezembro = doMes.docs.filter((d) => d.data().month === '2026-12');
    expect(deDezembro).toHaveLength(1);
  });
});
