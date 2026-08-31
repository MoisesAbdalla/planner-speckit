import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

/*
 * Sobre o `authDomain`: seria tentador usar o domínio do próprio site (o
 * Firebase Hosting serve o handler de login em `/__/auth/*`), deixando o login
 * na mesma origem. Mas o cliente OAuth do Google só aceita as URIs de
 * redirecionamento registradas nele, e por padrão a única registrada é
 * `<projeto>.firebaseapp.com/__/auth/handler` — apontar para outro domínio
 * devolve "Erro 400: redirect_uri_mismatch".
 *
 * Por isso mantemos o domínio configurado e resolvemos o problema de origem
 * cruzada pelo login em popup (ver `googleSignIn.ts`), que devolve a
 * credencial pela própria janela em vez de depender de armazenamento de
 * terceiros. Para usar o domínio do site aqui, seria preciso antes registrar
 * `https://<seu-site>/__/auth/handler` nas URIs de redirecionamento
 * autorizadas do cliente OAuth, no Google Cloud Console.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Chaves que faltam no `.env.local`.
 *
 * Em vez de estourar na importação e deixar a tela branca, a lista é exportada
 * para o App mostrar o que fazer. Quem acabou de clonar o projeto merece uma
 * instrução, não um erro no console.
 */
export const missingConfigKeys = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key.replace(/([A-Z])/g, '_$1').toUpperCase())
  .map((key) => `VITE_FIREBASE_${key}`);

export const isConfigured = missingConfigKeys.length === 0;

// Sem configuração, o app nunca chega às rotas — estes valores existem só
// para o módulo carregar sem explodir.
export const app = initializeApp(
  isConfigured ? config : { apiKey: 'sem-configuracao', projectId: 'sem-configuracao' },
);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (isConfigured && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
