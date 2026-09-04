import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { ThemeProvider } from './design/ThemeProvider';
import './design/tokens.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado no index.html.');

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);

/**
 * Registra o service worker que faz o app abrir sem internet.
 *
 * Só em produção: em desenvolvimento ele guardaria os arquivos do servidor
 * do Vite e você passaria a ver versões velhas a cada alteração.
 *
 * Depois do `load` para não disputar rede com a primeira renderização — o
 * service worker serve da segunda visita em diante, então correr aqui não
 * adianta nada.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((cause) => {
      // Falhar aqui custa o modo offline, não o app. Não vale interromper.
      console.error('Não foi possível registrar o service worker:', cause);
    });
  });
}
