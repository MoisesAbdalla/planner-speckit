import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../../../design/components/Button';
import { Modal } from '../../../design/components/Modal';
import { monthOf, todayISO } from '../../../shared/dates';
import { useAssistant } from '../AssistantContext';
import { useSpeechRecognition, SPEECH_ERROR_MESSAGES } from '../../../shared/useSpeechRecognition';
import { readPhrase } from '../lib/phraseReading';
import type { ReadingKind } from '../assistantTypes';

/**
 * O assistente: uma linha do livro-caixa sendo escrita.
 *
 * O campo não é uma caixa de conversa — é uma régua com o texto pousado nela,
 * a mesma régua das linhas de lançamento. Enquanto escuta, é a própria régua
 * que pulsa: o app não ganha um vocabulário novo para dizer "estou ouvindo".
 *
 * **Este componente não grava nada.** Ele produz um rascunho e o entrega ao
 * formulário — de lançamento ou de tarefa —, que é quem grava. Se algum dia
 * parecer conveniente chamar `createTransaction` ou `createTask` daqui, isso é
 * violação do FR-013, não uma simplificação.
 */
export function AssistantPanel() {
  const assistente = useAssistant();
  const navigate = useNavigate();
  const location = useLocation();
  const [frase, setFrase] = useState('');
  /** `null` = seguir o lado que o assistente escolheu; preenchido = a pessoa trocou. */
  const [ladoEscolhido, setLadoEscolhido] = useState<ReadingKind | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);
  const voz = useSpeechRecognition((texto) => setFrase(texto));

  const aberto = assistente?.open ?? false;
  const noPlanner = location.pathname.startsWith('/planner');
  const texto = voz.listening && voz.transcript ? voz.transcript : frase;

  useEffect(() => {
    if (aberto) campoRef.current?.focus();
  }, [aberto]);

  /**
   * A leitura é refeita a cada tecla, sem _debounce_.
   *
   * É aritmética sobre uma frase de até 140 caracteres — o atraso só criaria
   * um intervalo em que a linha abaixo do campo discorda do texto na tela,
   * que é pior do que o problema que resolveria.
   *
   * O período vem do lugar certo: no planner, do dia em exibição; fora dele,
   * do mês do financeiro. Sem essa regra, "dia 5" escrito no planner em agosto
   * viraria 5 de setembro se o financeiro estivesse em setembro — calado.
   */
  const leitura = useMemo(() => {
    if (!assistente || !texto.trim()) return null;
    return readPhrase(texto, {
      categories: assistente.categories,
      history: assistente.history,
      today: todayISO(),
      viewMonth: noPlanner ? monthOf(assistente.viewDate) : assistente.viewMonth,
    });
  }, [assistente, texto, noPlanner]);

  if (!assistente || !aberto) return null;

  const lado: ReadingKind = ladoEscolhido ?? leitura?.kind ?? 'transaction';

  const fechar = () => {
    voz.stop();
    setFrase('');
    setLadoEscolhido(null);
    assistente.setOpen(false);
  };

  const continuar = () => {
    if (!leitura || !texto.trim()) return;
    voz.stop();

    assistente.setPending({ reading: leitura, kind: lado, phrase: texto.trim() });

    setFrase('');
    setLadoEscolhido(null);
    assistente.setOpen(false);

    // Cada formulário mora na sua página. Aberto de outra tela, o rascunho
    // fica esperando e a página o consome ao montar (FR-017).
    const destino = lado === 'task' ? '/planner/dia' : '/financas';
    if (!location.pathname.startsWith(destino)) navigate(destino);
  };

  return (
    <Modal
      open
      title="Lançar por frase"
      onClose={fechar}
      footer={
        <>
          <Button variant="secondary" onClick={fechar}>
            Cancelar
          </Button>
          <Button onClick={continuar} disabled={!texto.trim()}>
            Continuar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {/* A régua: o texto pousa nela, como uma linha nova do livro-caixa.
            Ouvindo, é a própria régua que pulsa. */}
        <div
          className={`flex items-center gap-2 border-b pb-2 transition-colors duration-[--ease-base] ${
            voz.listening ? 'animate-pulse border-acao' : 'border-rule-strong'
          }`}
        >
          <input
            ref={campoRef}
            value={texto}
            onChange={(e) => {
              setFrase(e.target.value);
              // Trocar de frase descarta a escolha anterior: o lado passa a
              // ser o que a leitura nova disser.
              setLadoEscolhido(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                continuar();
              }
            }}
            placeholder="20 no mercado"
            maxLength={140}
            aria-label="Escreva o lançamento ou a tarefa em uma frase"
            className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-ink-faint"
          />

          {voz.supported && (
            <button
              type="button"
              onClick={() => (voz.listening ? voz.stop() : voz.start())}
              aria-label={voz.listening ? 'Parar de ouvir' : 'Falar'}
              aria-pressed={voz.listening}
              className={`shrink-0 rounded-full p-2 transition-colors duration-[--ease-snap] ${
                voz.listening ? 'bg-acao text-paper' : 'text-ink-soft hover:bg-paper-sunken'
              }`}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                <rect x="7.25" y="2.5" width="5.5" height="10" rx="2.75" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {leitura && <LinhaDeLeitura lado={lado} ambigua={leitura.ambiguous} onTrocar={setLadoEscolhido} />}

        {voz.listening && (
          <p role="status" className="text-xs text-acao">
            Ouvindo… fale a frase. Toque no microfone para parar.
          </p>
        )}

        {voz.error && (
          <p role="alert" className="text-xs text-saida">
            {SPEECH_ERROR_MESSAGES[voz.error]}
          </p>
        )}

        <p className="text-xs text-ink-faint">
          Entende <span className="text-ink-soft">salário 3200</span>,{' '}
          <span className="text-ink-soft">47,90 no posto ontem</span> e{' '}
          <span className="text-ink-soft">dentista sexta às 9h</span>. O que faltar, você completa
          no formulário.
        </p>
      </div>
    </Modal>
  );
}

/**
 * O que o assistente entendeu, e a saída quando ele erra.
 *
 * A frase confiante e a ambígua são ditas de formas diferentes de propósito:
 * dizer a mesma coisa nos dois casos desperdiçaria a única informação que faz
 * a pessoa olhar antes de confirmar justamente quando olhar vale a pena.
 *
 * A troca está disponível **sempre**, e não só nas ambíguas — o assistente
 * também erra com convicção, e sem ela a correção custaria apagar tudo e
 * reescrever.
 */
function LinhaDeLeitura({
  lado,
  ambigua,
  onTrocar,
}: {
  lado: ReadingKind;
  ambigua: boolean;
  onTrocar: (lado: ReadingKind) => void;
}) {
  const outro: ReadingKind = lado === 'task' ? 'transaction' : 'task';
  const nome = (k: ReadingKind) => (k === 'task' ? 'tarefa' : 'lançamento');

  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
      <span className={ambigua ? 'text-atencao' : 'text-ink-soft'}>
        {ambigua ? 'Pode ser tarefa ou lançamento.' : `Entendi como ${nome(lado)}.`}
      </span>
      <button
        type="button"
        onClick={() => onTrocar(outro)}
        className={`rounded-sm underline underline-offset-2 transition-colors duration-[--ease-snap] ${
          ambigua ? 'font-medium text-atencao hover:text-ink' : 'text-ink-faint hover:text-ink'
        }`}
      >
        {ambigua ? `É ${nome(outro)}` : `Trocar para ${nome(outro)}`}
      </button>
    </p>
  );
}
