import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskForm } from '../../src/features/planner/components/TaskForm';

/**
 * A prova de que o assistente não mexeu no caminho manual (FR-019).
 *
 * O formulário de tarefa existe desde a primeira feature e é usado pelo botão
 * de sempre. Acrescentar o rascunho a ele é exatamente o tipo de mudança que
 * vaza para o caminho de todo dia sem ninguém notar.
 */
const props = { open: true, onClose: vi.fn(), onSave: vi.fn() };

describe('formulário de tarefa aberto à mão — como sempre foi', () => {
  it('nasce com o nome vazio', () => {
    render(<TaskForm {...props} />);
    expect((screen.getByLabelText('O que você vai fazer') as HTMLInputElement).value).toBe('');
  });

  it('não mostra a leitura da frase, porque não houve frase', () => {
    render(<TaskForm {...props} />);
    expect(screen.queryByText(/Entendi/)).toBeNull();
    expect(screen.queryByText(/Não entendi/)).toBeNull();
  });

  it('usa a data padrão que a página passa', () => {
    render(<TaskForm {...props} defaultDate="2026-09-10" />);
    expect((screen.getByLabelText('Data') as HTMLInputElement).value).toBe('2026-09-10');
  });
});

describe('formulário de tarefa aberto pelo assistente', () => {
  const rascunho = {
    title: 'pagar iptu',
    date: '2026-08-28',
    dateFromPhrase: true,
    time: null,
    understood: true,
  };

  it('chega preenchido com o que foi entendido', () => {
    render(<TaskForm {...props} prefill={rascunho} />);
    expect((screen.getByLabelText('O que você vai fazer') as HTMLInputElement).value).toBe('pagar iptu');
    expect((screen.getByLabelText('Data') as HTMLInputElement).value).toBe('2026-08-28');
  });

  it('diz o que entendeu (FR-016)', () => {
    render(<TaskForm {...props} prefill={rascunho} />);
    expect(screen.getByText(/Entendi/)).toBeTruthy();
  });

  it('avisa que a data é padrão quando ela não veio da frase', () => {
    const semData = { ...rascunho, date: '2026-09-02', dateFromPhrase: false };
    render(<TaskForm {...props} prefill={semData} />);
    expect(screen.getByText(/data é hoje, por padrão/)).toBeTruthy();
  });

  it('a hora entendida chega ao campo, e sem hora ele fica vazio', () => {
    const { unmount } = render(<TaskForm {...props} prefill={{ ...rascunho, time: '07:00' }} />);
    expect((screen.getByLabelText('Horário') as HTMLInputElement).value).toBe('07:00');
    unmount();

    render(<TaskForm {...props} prefill={rascunho} />);
    expect((screen.getByLabelText('Horário') as HTMLInputElement).value).toBe('');
  });

  it('frase não entendida avisa, em vez de abrir um formulário mudo', () => {
    const naoEntendida = { ...rascunho, title: '', dateFromPhrase: false, understood: false };
    render(<TaskForm {...props} prefill={naoEntendida} />);
    expect(screen.getByText(/Não entendi essa frase/)).toBeTruthy();
  });
});
