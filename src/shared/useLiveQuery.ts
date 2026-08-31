import { useEffect, useRef, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';

interface LiveState<T> {
  key: string;
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Assinatura de uma consulta em tempo real do Firestore.
 *
 * O estado carrega a chave da consulta que o produziu. Assim, quando a chave
 * muda (outro mês, outro intervalo), o "carregando" é derivado na renderização
 * em vez de escrito de dentro do efeito — o dado do mês anterior nunca
 * aparece por um quadro no mês novo.
 */
export function useLiveQuery<T>(
  key: string,
  subscribe: (emit: (data: T[]) => void, fail: (cause: unknown) => void) => Unsubscribe,
  errorMessage = 'Não foi possível carregar estes dados.',
) {
  const subscribeRef = useRef(subscribe);

  // Declarado antes do efeito de assinatura para que a referência já esteja
  // atualizada quando ele rodar.
  useEffect(() => {
    subscribeRef.current = subscribe;
  });

  const [state, setState] = useState<LiveState<T>>({
    key,
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    return subscribeRef.current(
      (data) => setState({ key, data, loading: false, error: null }),
      (cause) => {
        console.error(cause);
        setState({ key, data: [], loading: false, error: errorMessage });
      },
    );
  }, [key, errorMessage]);

  const stale = state.key !== key;

  return {
    data: stale ? [] : state.data,
    loading: stale || state.loading,
    error: stale ? null : state.error,
  };
}
