import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { createTestEnv, validTransaction, validTask } from './setup';

/** FR-002: um usuário nunca acessa dados de outro. */
describe('isolamento por usuário', () => {
  let env: RulesTestEnvironment;
  const ANA = 'uid-ana';
  const BRUNO = 'uid-bruno';

  beforeAll(async () => {
    env = await createTestEnv();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  beforeEach(async () => {
    await env.clearFirestore();
    // Dados da Ana, gravados sem passar pelas regras.
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'users', ANA), { displayName: 'Ana', email: 'ana@exemplo.com' });
      await setDoc(doc(db, 'users', ANA, 'transactions', 'tx-1'), validTransaction());
      await setDoc(doc(db, 'users', ANA, 'tasks', 'task-1'), validTask());
    });
  });

  it('deixa a dona ler as próprias movimentações', async () => {
    const ana = env.authenticatedContext(ANA).firestore();
    await assertSucceeds(getDoc(doc(ana, 'users', ANA, 'transactions', 'tx-1')));
  });

  it('impede outro usuário de ler as movimentações da Ana', async () => {
    const bruno = env.authenticatedContext(BRUNO).firestore();
    await assertFails(getDoc(doc(bruno, 'users', ANA, 'transactions', 'tx-1')));
  });

  it('impede outro usuário de listar a coleção da Ana', async () => {
    const bruno = env.authenticatedContext(BRUNO).firestore();
    await assertFails(getDocs(collection(bruno, 'users', ANA, 'transactions')));
  });

  it('impede outro usuário de escrever na conta da Ana', async () => {
    const bruno = env.authenticatedContext(BRUNO).firestore();
    await assertFails(
      setDoc(doc(bruno, 'users', ANA, 'transactions', 'tx-invasor'), validTransaction()),
    );
  });

  it('impede outro usuário de apagar dados da Ana', async () => {
    const bruno = env.authenticatedContext(BRUNO).firestore();
    await assertFails(deleteDoc(doc(bruno, 'users', ANA, 'transactions', 'tx-1')));
  });

  it('impede outro usuário de ver as tarefas da Ana', async () => {
    const bruno = env.authenticatedContext(BRUNO).firestore();
    await assertFails(getDoc(doc(bruno, 'users', ANA, 'tasks', 'task-1')));
  });

  it('impede visitante sem login de ler qualquer coisa', async () => {
    const anonimo = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonimo, 'users', ANA, 'transactions', 'tx-1')));
    await assertFails(getDoc(doc(anonimo, 'users', ANA)));
  });

  it('nega qualquer caminho fora de users/{uid}', async () => {
    const ana = env.authenticatedContext(ANA).firestore();
    await assertFails(getDoc(doc(ana, 'configuracoes', 'globais')));
    await assertFails(setDoc(doc(ana, 'configuracoes', 'globais'), { a: 1 }));
  });

  it('deixa a dona escrever na própria conta', async () => {
    const ana = env.authenticatedContext(ANA).firestore();
    await assertSucceeds(
      setDoc(doc(ana, 'users', ANA, 'transactions', 'tx-2'), validTransaction()),
    );
  });
});
