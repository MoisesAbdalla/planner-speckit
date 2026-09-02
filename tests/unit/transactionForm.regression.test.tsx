import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionForm } from '../../src/features/finance/components/TransactionForm';
import { CATEGORIAS } from './fixtures/phrases';

/**
 * A prova de que o assistente não mexeu no caminho manual (FR-021).
 *
 * O formulário sempre pré-selecionou a primeira categoria da lista. Foi
 * preciso ensiná-lo a **não** fazer isso quando o assistente o abre sem ter
 * reconhecido categoria — e é exatamente o tipo de mudança que vaza para o
 * caminho de todo dia sem ninguém notar. Este teste tranca as duas metades.
 */

const props = {
  open: true,
  categories: CATEGORIAS,
  onClose: vi.fn(),
  onSave: vi.fn(),
};

function categoriaSelecionada(): string {
  return (screen.getByLabelText('Categoria') as HTMLSelectElement).value;
}

describe('formulário aberto à mão — como sempre foi', () => {
  it('pré-seleciona a primeira categoria', () => {
    render(<TransactionForm {...props} />);
    expect(categoriaSelecionada()).toBe('cat-alimentacao');
  });

  it('não oferece a opção "Escolha uma categoria"', () => {
    render(<TransactionForm {...props} />);
    expect(screen.queryByRole('option', { name: 'Escolha uma categoria' })).toBeNull();
  });

  it('não mostra a leitura da frase, porque não houve frase', () => {
    render(<TransactionForm {...props} />);
    expect(screen.queryByText(/Entendi/)).toBeNull();
    expect(screen.queryByText(/Não entendi/)).toBeNull();
  });

  it('o título continua "Novo lançamento"', () => {
    render(<TransactionForm {...props} />);
    expect(screen.getByText('Novo lançamento')).toBeTruthy();
  });

  it('o valor começa vazio', () => {
    render(<TransactionForm {...props} />);
    expect((screen.getByLabelText('Valor') as HTMLInputElement).value).toBe('');
  });
});

describe('formulário aberto pelo assistente', () => {
  const rascunho = {
    amountCents: 2000,
    type: 'expense' as const,
    typeFromPhrase: false,
    date: '2026-09-01',
    dateFromPhrase: false,
    description: 'mercado',
    categoryId: 'cat-alimentacao',
    categorySource: 'dicionário' as const,
    understood: true,
  };

  it('chega preenchido com o que foi entendido', () => {
    render(<TransactionForm {...props} prefill={rascunho} />);
    expect((screen.getByLabelText('Valor') as HTMLInputElement).value).toBe('20,00');
    expect((screen.getByLabelText('Descrição') as HTMLInputElement).value).toBe('mercado');
    expect(categoriaSelecionada()).toBe('cat-alimentacao');
  });

  it('diz o que entendeu e o que é padrão (FR-009)', () => {
    render(<TransactionForm {...props} prefill={rascunho} />);
    expect(screen.getByText(/Entendi valor e categoria/)).toBeTruthy();
    expect(screen.getByText(/são o padrão/)).toBeTruthy();
  });

  it('sem categoria reconhecida, o campo fica vazio — não cai na primeira', () => {
    const semCategoria = { ...rascunho, categoryId: null, categorySource: null };
    render(
      <TransactionForm {...props} prefill={semCategoria} requireExplicitCategory />,
    );
    expect(categoriaSelecionada()).toBe('');
    expect(screen.getByRole('option', { name: 'Escolha uma categoria' })).toBeTruthy();
  });

  it('frase não entendida avisa, em vez de abrir um formulário mudo (FR-013)', () => {
    const naoEntendida = {
      ...rascunho,
      amountCents: null,
      categoryId: null,
      categorySource: null,
      description: 'bom dia',
      understood: false,
    };
    render(<TransactionForm {...props} prefill={naoEntendida} />);
    expect(screen.getByText(/Não entendi essa frase/)).toBeTruthy();
    expect((screen.getByLabelText('Descrição') as HTMLInputElement).value).toBe('bom dia');
  });
});
