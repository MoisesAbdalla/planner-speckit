import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useCategories } from './hooks/useCategories';
import { useDescriptionHistory } from './hooks/useDescriptionHistory';
import type { DescriptionHistory, PendingDraft } from './assistantTypes';
import type { Category } from './types';
import { currentMonth, type ISOMonth } from '../../shared/dates';

/**
 * A ponte entre o assistente e o formulário.
 *
 * Existe por um motivo estrutural: o botão do assistente vive no `AppShell`,
 * que está **fora** das rotas, e o formulário de lançamento vive dentro de
 * `routes/Finance.tsx`. Um não alcança o outro. Este contexto é a menor peça
 * que resolve isso — sem duplicar o formulário e sem subir o estado do mês
 * para um contexto global.
 *
 * O rascunho é dado efêmero de interface: não vai para o Firestore e não
 * sobrevive a um recarregamento. E não deve mesmo — nada foi confirmado,
 * então nada é devido.
 */

interface AssistantValue {
  pending: PendingDraft | null;
  setPending: (draft: PendingDraft) => void;
  /** Devolve **e limpa**. Ver o comentário em `consume`. */
  consume: () => PendingDraft | null;
  /** As categorias da pessoa, disponíveis em qualquer tela. */
  categories: Category[];
  /** O que a pessoa costuma fazer — descrição normalizada → categoria. */
  history: DescriptionHistory;
  /**
   * O mês que a pessoa está olhando — base de "dia 5".
   *
   * Quem está em agosto e escreve "dia 5" quer 5 de agosto (R4). A página
   * financeira publica o mês aqui porque o painel vive no `AppShell`, fora
   * dela. De outra tela, vale o mês corrente, que é o que a página abriria.
   */
  viewMonth: ISOMonth;
  setViewMonth: (month: ISOMonth) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AssistantContext = createContext<AssistantValue | null>(null);

export function AssistantProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [pending, setPendingState] = useState<PendingDraft | null>(null);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<ISOMonth>(() => currentMonth());

  /**
   * As categorias são carregadas **aqui**, e não na página financeira.
   *
   * `useCategories` só era chamado em `routes/Finance.tsx`. Como o assistente
   * abre de qualquer tela, inclusive do planner, sem isto ele ficaria sem
   * categorias e devolveria `categoryId` nulo sempre — parecendo capricho do
   * interpretador, quando na verdade seria falta de dado.
   */
  const { categories } = useCategories(uid);

  // O histórico é lido na primeira abertura, uma vez por sessão.
  const { history, carregar } = useDescriptionHistory(uid);

  const abrir = useCallback(
    (aberto: boolean) => {
      // Ler ao abrir, e não ao montar: quem nunca usa o assistente não paga
      // uma consulta por sessão para nada.
      if (aberto) void carregar();
      setOpen(aberto);
    },
    [carregar],
  );

  // Ref espelhando o estado: `consume` precisa ler o valor atual sem se
  // recriar a cada rascunho, senão o efeito que a consome dispara em laço.
  const pendingRef = useRef<PendingDraft | null>(null);

  const setPending = useCallback((draft: PendingDraft) => {
    pendingRef.current = draft;
    setPendingState(draft);
  }, []);

  /**
   * Consumir limpa por definição.
   *
   * Sem isso, voltar ao financeiro reabriria o formulário com um rascunho
   * velho e a pessoa gravaria de novo o que já gravou. É a mesma classe de
   * erro que a navegação de mês evita: duplicata que nasce da tela.
   */
  const consume = useCallback(() => {
    const atual = pendingRef.current;
    pendingRef.current = null;
    setPendingState(null);
    return atual;
  }, []);

  const value = useMemo(
    () => ({
      pending,
      setPending,
      consume,
      categories,
      history,
      viewMonth,
      setViewMonth,
      open,
      setOpen: abrir,
    }),
    [pending, setPending, consume, categories, history, viewMonth, open, abrir],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

/**
 * `null` fora do provider — o assistente só existe autenticado, e a tela de
 * login não deve quebrar por perguntar.
 */
export function useAssistant(): AssistantValue | null {
  return useContext(AssistantContext);
}
