import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../../../design/components/Button';
import { Modal } from '../../../design/components/Modal';
import { todayISO } from '../../../shared/dates';
import { useAssistant } from '../AssistantContext';
import { useSpeechRecognition, SPEECH_ERROR_MESSAGES } from '../../../shared/useSpeechRecognition';
import { parsePhrase } from '../lib/phraseParser';

/**
 * O assistente: uma linha do livro-caixa sendo escrita.
 *
 * O campo não é uma caixa de conversa — é uma régua com o texto pousado nela,
 * a mesma régua das linhas de lançamento. Enquanto escuta, é a própria régua
 * que pulsa: o app não ganha um vocabulário novo para dizer "estou ouvindo".
 *
 * **Este componente não grava nada.** Ele produz um rascunho e o entrega ao
 * formulário, que é quem grava. Se algum dia parecer conveniente chamar
 * `createTransaction` daqui, isso é violação do FR-010 e do FR-012.
 */
export function AssistantPanel() {
  const assistente = useAssistant();
  const navigate = useNavigate();
  const location = useLocation();
  const [frase, setFrase] = useState('');
  const campoRef = useRef<HTMLInputElement>(null);
  // A transcrição cai no campo e fica editável antes de virar rascunho
  // (FR-015): quem falou errado corrige em vez de recomeçar.
  const voz = useSpeechRecognition((texto) => setFrase(texto));

  const aberto = assistente?.open ?? false;

  useEffect(() => {
    if (aberto) campoRef.current?.focus();
  }, [aberto]);

  if (!assistente || !aberto) return null;

  const fechar = () => {
    voz.stop();
    setFrase('');
    assistente.setOpen(false);
  };

  const interpretar = () => {
    const texto = frase.trim();
    if (!texto) return;
    voz.stop();

    const parsed = parsePhrase(texto, {
      categories: assistente.categories,
      history: assistente.history,
      today: todayISO(),
      viewMonth: assistente.viewMonth,
    });

    // Frase não entendida ainda vira rascunho: o formulário abre com o texto
    // na descrição e diz que não entendeu, em vez de falhar em silêncio (FR-013).
    assistente.setPending({
      parsed: parsed.understood ? parsed : { ...parsed, description: texto },
      phrase: texto,
    });

    setFrase('');
    assistente.setOpen(false);

    // O formulário mora na página financeira. Aberto de outra tela, o rascunho
    // fica esperando e ela o consome ao montar (FR-026).
    if (location.pathname !== '/financas') navigate('/financas');
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
          <Button onClick={interpretar} disabled={!frase.trim()}>
            Continuar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* A régua: o texto pousa nela, como uma linha nova do livro-caixa.
            Ouvindo, é a própria régua que pulsa — o app não ganha um
            vocabulário novo só para dizer "estou escutando". */}
        <div
          className={`flex items-center gap-2 border-b pb-2 transition-colors duration-[--ease-base] ${
            voz.listening ? 'animate-pulse border-acao' : 'border-rule-strong'
          }`}
        >
          <input
            ref={campoRef}
            value={voz.listening && voz.transcript ? voz.transcript : frase}
            onChange={(e) => setFrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                interpretar();
              }
            }}
            placeholder="20 no mercado"
            maxLength={140}
            aria-label="Escreva o lançamento em uma frase"
            className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-ink-faint"
          />

          {/* O microfone só existe onde o navegador o oferece (FR-014). Um
              botão cinza que não faz nada parece defeito do app. */}
          {voz.supported && (
            <button
              type="button"
              onClick={() => (voz.listening ? voz.stop() : voz.start())}
              aria-label={voz.listening ? 'Parar de ouvir' : 'Falar o lançamento'}
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
          Também entende <span className="text-ink-soft">salário 3200</span> e{' '}
          <span className="text-ink-soft">paguei 47,90 no posto ontem</span>. O que faltar, você
          completa no formulário.
        </p>
      </div>
    </Modal>
  );
}
