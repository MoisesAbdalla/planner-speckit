import { useCallback, useRef, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { addMonths, currentMonth } from '../../../shared/dates';
import type { DescriptionHistory } from '../assistantTypes';
import { construirHistorico } from '../lib/descriptionHistory';
import type { Transaction } from '../types';

/** O mesmo horizonte que as recorrências usam — o app tem uma noção só de "passado recente". */
const MESES = 3;

/**
 * A memória de categorias: o que **esta pessoa** costuma fazer.
 *
 * É leitura pura do que já existe — nenhuma coleção nova, nenhum campo novo,
 * nada gravado por causa disto. Some ao recarregar a página, e está certo:
 * reconstrói-se na próxima abertura do assistente.
 *
 * Uma leitura por sessão, na primeira abertura. Um listener vivo custaria
 * conexão permanente para melhorar uma sugestão que a pessoa corrige com um
 * toque — não paga.
 */
export function useDescriptionHistory(uid: string) {
  const [history, setHistory] = useState<DescriptionHistory>({});
  const jaLeu = useRef(false);

  const carregar = useCallback(async () => {
    if (jaLeu.current) return;
    jaLeu.current = true;

    const mes = currentMonth();
    const meses = Array.from({ length: MESES }, (_, i) => addMonths(mes, -i));

    try {
      // `in` com três valores é uma consulta só, atendida pelo índice de campo
      // único que o Firestore mantém sozinho. Sem `orderBy`: ele omite do
      // resultado todo documento sem o campo ordenado, e essa lição já custou
      // caro nas recorrências.
      const snapshot = await getDocs(
        query(collection(db, 'users', uid, 'transactions'), where('month', 'in', meses)),
      );

      setHistory(construirHistorico(snapshot.docs.map((d) => d.data() as Transaction)));
    } catch (cause) {
      // Falhar aqui só custa a sugestão de categoria: o assistente continua
      // interpretando valor, tipo e data. Não vale interromper a pessoa.
      console.error('Não foi possível ler o histórico de categorias:', cause);
    }
  }, [uid]);

  return { history, carregar };
}
