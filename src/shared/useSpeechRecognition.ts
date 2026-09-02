import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Reconhecimento de voz do navegador, encapsulado.
 *
 * Não instala nada e não fala com serviço nosso: é a Web Speech API, que o
 * Chrome, o Edge e o Safari oferecem e o Firefox não. Por isso `supported`
 * não é cortesia — é a diferença entre a interface mostrar um recurso ou
 * fingir que ele existe.
 *
 * **O áudio não é gravado nem guardado** (FR-018): o hook trabalha só com o
 * texto que a API devolve. Vale dizer o que isso não significa: no Chrome, o
 * áudio trafega até os servidores do Google para virar texto. É do navegador,
 * não do app — mas chamar isto de "tudo local" seria falso.
 */

export type SpeechError = 'not-allowed' | 'no-speech' | 'audio-capture' | 'network' | 'falhou';

/** Cada código vira uma frase que diz o que fazer. "Erro ao ouvir" não diz. */
export const SPEECH_ERROR_MESSAGES: Record<SpeechError, string> = {
  'not-allowed':
    'O microfone está bloqueado para este site. Libere nas permissões do navegador e tente de novo.',
  'no-speech': 'Não ouvi nada. Toque no microfone e fale.',
  'audio-capture': 'Nenhum microfone disponível neste aparelho. Escreva a frase.',
  network: 'A transcrição não pôde ser feita agora. Escreva a frase.',
  falhou: 'A escuta falhou. Escreva a frase.',
};

function construtor(): typeof SpeechRecognition | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function useSpeechRecognition(onFinal?: (texto: string) => void) {
  const [supported] = useState(() => construtor() !== undefined);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<SpeechError | null>(null);

  /**
   * A instância fica em **estado**, não em ref, e é de propósito: assim o
   * efeito abaixo encerra a escuta anterior sozinho quando uma nova começa, e
   * também quando o componente sai. Deixar a API rodando manteria o indicador
   * de microfone do navegador aceso sem nenhuma tela para desligá-lo.
   */
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Em ref para o callback não recriar `start` a cada renderização — e
  // atualizada num efeito, não durante a renderização: mexer numa ref
  // enquanto o componente renderiza é justamente o que faz a tela não
  // acompanhar o valor novo.
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => {
    if (!recognition) return;
    return () => recognition.abort();
  }, [recognition]);

  const stop = useCallback(() => {
    recognition?.stop();
    setListening(false);
  }, [recognition]);

  const start = useCallback(() => {
    const Reconhecimento = construtor();
    if (!Reconhecimento) return;

    setError(null);
    setTranscript('');

    const reconhecimento = new Reconhecimento();
    reconhecimento.lang = 'pt-BR';
    // Uma frase e para: escuta contínua ficaria ligada esperando silêncio.
    reconhecimento.continuous = false;
    // O texto aparecendo enquanto se fala é o que torna óbvio que o app está
    // ouvindo, sem precisar inventar uma animação para dizer isso (FR-016).
    reconhecimento.interimResults = true;
    reconhecimento.maxAlternatives = 1;

    reconhecimento.onresult = (event) => {
      let texto = '';
      let final = false;
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const resultado = event.results[i]!;
        texto += resultado[0]?.transcript ?? '';
        if (resultado.isFinal) final = true;
      }
      setTranscript(texto);
      if (final && texto.trim()) onFinalRef.current?.(texto.trim());
    };

    reconhecimento.onerror = (event) => {
      // `aborted` é a pessoa mandando parar: não é erro e não merece mensagem.
      if (event.error === 'aborted') return;
      const conhecidos: SpeechError[] = ['not-allowed', 'no-speech', 'audio-capture', 'network'];
      const codigo = conhecidos.includes(event.error as SpeechError)
        ? (event.error as SpeechError)
        : 'falhou';
      setError(codigo);
      setListening(false);
    };

    reconhecimento.onend = () => setListening(false);

    setRecognition(reconhecimento);
    try {
      reconhecimento.start();
      setListening(true);
    } catch {
      // start() lança se já estiver ouvindo — nada a relatar à pessoa.
      setListening(false);
    }
  }, []);

  return { supported, listening, transcript, error, start, stop };
}
