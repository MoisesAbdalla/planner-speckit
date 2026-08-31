import { useEffect, useRef } from 'react';
import { materializeHorizon, materializeMonth } from '../lib/materializeRecurrences';
import type { ISOMonth } from '../../../shared/dates';
import type { Recurrence } from '../types';

/**
 * Cria os lançamentos previstos das recorrências ativas quando eles faltam.
 *
 * Dispara ao entrar (horizonte de 3 meses) e ao abrir um mês qualquer, para
 * quem navega mais longe do que o horizonte. A operação é idempotente pelo id
 * determinístico, então repetir não duplica nada — inclusive entre aparelhos.
 */
export function useMaterialization(
  uid: string,
  recurrences: Recurrence[],
  month: ISOMonth,
  ready: boolean,
) {
  const doneMonths = useRef(new Set<string>());
  const horizonDone = useRef(false);

  useEffect(() => {
    if (!ready || recurrences.length === 0) return;

    const signature = recurrences.map((r) => `${r.id}:${r.endMonth ?? ''}`).join('|');

    if (!horizonDone.current) {
      horizonDone.current = true;
      void materializeHorizon(uid, recurrences, month).catch(console.error);
      return;
    }

    const key = `${month}#${signature}`;
    if (doneMonths.current.has(key)) return;
    doneMonths.current.add(key);
    void materializeMonth(uid, recurrences, month).catch(console.error);
  }, [uid, recurrences, month, ready]);
}
