import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
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

describe('a recorrência semanal precisa aparecer na consulta', () => {
  /**
   * Este teste existe por causa de um defeito concreto: a consulta ordenava por
   * `dayOfMonth`, e o Firestore **omite do resultado** todo documento que não
   * tem o campo ordenado. Uma recorrência semanal, que não usa dia do mês,
   * simplesmente não voltava — cadastrada com sucesso e invisível para sempre.
   */
  it('a recorrência sem dayOfMonth volta na consulta que o app usa', async () => {
    await setDoc(doc(db, 'users', uid, 'recurrences', 'feira'), {
      type: 'expense',
      amountCents: 8000,
      description: 'Feira',
      categoryId: 'cat-alimentacao',
      frequency: 'weekly',
      weekday: 2,
      startMonth: '2027-03',
      endMonth: null,
    });

    const semOrdenacao = await getDocs(collection(db, 'users', uid, 'recurrences'));
    expect(semOrdenacao.docs.map((d) => d.id)).toContain('feira');
  });

  it('e a consulta ordenada por dayOfMonth a perderia — a razão de não ordenar', async () => {
    const ordenada = await getDocs(
      query(collection(db, 'users', uid, 'recurrences'), orderBy('dayOfMonth')),
    );
    expect(ordenada.docs.map((d) => d.id)).not.toContain('feira');
  });

  it('materializa as cinco ocorrências do mês e não repete na segunda rodada', async () => {
    const feira: Recurrence = {
      id: 'feira',
      type: 'expense',
      amountCents: 8000,
      description: 'Feira',
      categoryId: 'cat-alimentacao',
      frequency: 'weekly',
      weekday: 2,
      dayOfMonth: 1,
      startMonth: '2027-03',
      endMonth: null,
    };

    // Março de 2027 tem cinco terças.
    expect(await materializeMonth(uid, [feira], '2027-03')).toBe(5);
    expect(await materializeMonth(uid, [feira], '2027-03')).toBe(0);

    const todas = await getDocs(collection(db, 'users', uid, 'transactions'));
    const deMarco = todas.docs.filter((d) => d.data().month === '2027-03');
    expect(deMarco).toHaveLength(5);
    expect(deMarco.map((d) => d.id).sort()).toEqual([
      'rec_feira_2027-03-02',
      'rec_feira_2027-03-09',
      'rec_feira_2027-03-16',
      'rec_feira_2027-03-23',
      'rec_feira_2027-03-30',
    ]);
  });

  it('excluir uma ocorrência registra o descarte e ela não volta', async () => {
    const feira: Recurrence = {
      id: 'feira',
      type: 'expense',
      amountCents: 8000,
      description: 'Feira',
      categoryId: 'cat-alimentacao',
      frequency: 'weekly',
      weekday: 2,
      dayOfMonth: 1,
      startMonth: '2027-03',
      endMonth: null,
    };

    const alvo = 'rec_feira_2027-03-16';
    const tx = {
      id: alvo,
      ...(await getDoc(doc(db, 'users', uid, 'transactions', alvo))).data(),
    } as Transaction;

    await deleteTransaction(uid, tx, feira);

    const gravada = await getDoc(doc(db, 'users', uid, 'recurrences', 'feira'));
    expect(gravada.data()!.skips).toContain('2027-03-16');

    // Materializar de novo com a recorrência atualizada não a recria.
    const atualizada = { ...feira, skips: gravada.data()!.skips as string[] };
    expect(await materializeMonth(uid, [atualizada], '2027-03')).toBe(0);
    expect((await getDoc(doc(db, 'users', uid, 'transactions', alvo))).exists()).toBe(false);
  });

  it('a anual cria um único previsto, no mês certo', async () => {
    const ipva: Recurrence = {
      id: 'ipva',
      type: 'expense',
      amountCents: 90000,
      description: 'IPVA',
      categoryId: 'cat-transporte',
      frequency: 'yearly',
      dayOfMonth: 15,
      monthOfYear: 1,
      startMonth: '2027-04',
      endMonth: null,
    };

    expect(await materializeMonth(uid, [ipva], '2027-06')).toBe(0);
    expect(await materializeMonth(uid, [ipva], '2028-01')).toBe(1);

    const previsto = await getDoc(doc(db, 'users', uid, 'transactions', 'rec_ipva_2028-01'));
    expect(previsto.exists()).toBe(true);
    expect(previsto.data()!.date).toBe('2028-01-15');
    expect(previsto.data()!.status).toBe('planned');
  });
});
