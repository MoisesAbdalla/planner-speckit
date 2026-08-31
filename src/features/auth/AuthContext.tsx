import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { bootstrapUser } from './lib/bootstrapUser';
import { completePendingRedirect, signInWithGoogle } from './lib/googleSignIn';

interface AuthValue {
  user: User | null;
  loading: boolean;
  /** Problema de configuração do projeto no Firebase, com o que fazer a respeito. */
  setupError: string | null;
  dismissSetupError: () => void;
  /** Falha de um login que voltou por redirect — senão ela sumiria calada. */
  redirectError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Quanto esperar o Firebase responder antes de assumir que algo está errado. */
const AUTH_TIMEOUT_MS = 10000;

/**
 * Traduz falhas de infraestrutura para o próximo passo concreto. Quase sempre
 * é uma etapa de configuração que ficou faltando, não um bug do app.
 */
export function setupErrorMessage(cause: unknown): string {
  const code = (cause as { code?: string }).code ?? '';

  if (code === 'permission-denied' || code.endsWith('permission-denied')) {
    return (
      'O Firestore recusou o acesso: as regras de segurança ainda não foram publicadas. ' +
      'Rode "npx firebase deploy --only firestore:rules,firestore:indexes" na pasta do projeto.'
    );
  }
  if (code === 'unavailable' || code === 'failed-precondition') {
    return (
      'Não foi possível falar com o Firestore. Confira se você criou o banco de dados no ' +
      'console do Firebase (Firestore Database → Criar banco de dados).'
    );
  }
  if (code === 'unauthenticated') {
    return 'Sua sessão expirou. Entre novamente.';
  }
  return `Não foi possível preparar sua conta. Detalhe técnico: ${
    code || (cause as Error)?.message || 'erro desconhecido'
  }`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    // Conclui um login que voltou por redirect. Sem isto, o retorno fica
    // pendente e a pessoa cai de volta na tela de login sem saber por quê.
    completePendingRedirect().catch((cause) => {
      console.error('Falha ao concluir o login com Google:', cause);
      setRedirectError(authErrorMessage(cause));
    });

    // Se o Firebase não responder, a tela não pode ficar em "Carregando" para
    // sempre: melhor mostrar o problema do que um spinner eterno.
    const timeout = setTimeout(() => {
      setLoading((current) => {
        if (!current) return current;
        setSetupError(
          'O Firebase não respondeu. Confira as chaves em .env.local, se o provedor ' +
            'E-mail/senha está habilitado em Authentication e se VITE_USE_FIREBASE_EMULATORS ' +
            'está como false (ou se os emuladores estão rodando).',
        );
        return false;
      });
    }, AUTH_TIMEOUT_MS);

    // A sessão persiste no aparelho até o logout explícito (FR-003) — é o
    // comportamento padrão do SDK (browserLocalPersistence).
    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        clearTimeout(timeout);
        setUser(nextUser);
        setLoading(false);

        // O preparo da conta acontece fora do caminho crítico: se ele falhar,
        // o app continua utilizável e o problema aparece como aviso.
        if (nextUser) {
          bootstrapUser(nextUser).catch((cause) => {
            console.error('Falha ao preparar a conta:', cause);
            setSetupError(setupErrorMessage(cause));
          });
        } else {
          setSetupError(null);
        }
      },
      (cause) => {
        clearTimeout(timeout);
        console.error('Falha na autenticação:', cause);
        setLoading(false);
        setSetupError(setupErrorMessage(cause));
      },
    );

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      setupError,
      dismissSetupError: () => setSetupError(null),
      redirectError,
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password);
      },
      async signUp(name, email, password) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
        // Falhar aqui não pode impedir a entrada: a conta já existe.
        await bootstrapUser(credential.user).catch((cause) => {
          console.error('Falha ao preparar a conta:', cause);
          setSetupError(setupErrorMessage(cause));
        });
      },
      async signInGoogle() {
        setRedirectError(null);
        await signInWithGoogle();
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email);
      },
      async logout() {
        await signOut(auth);
      },
    }),
    [user, loading, setupError, redirectError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return value;
}

/** O uid atual, para as consultas. Só use dentro de rotas protegidas. */
export function useUid(): string {
  const { user } = useAuth();
  if (!user) throw new Error('Sem usuário autenticado nesta rota.');
  return user.uid;
}

/** Mensagens de erro do Firebase traduzidas para o que a pessoa pode fazer. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string }).code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido. Confira se está escrito corretamente.';
    case 'auth/missing-password':
      return 'Digite sua senha.';
    case 'auth/weak-password':
      return 'A senha precisa de pelo menos 6 caracteres.';
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com esse e-mail. Entre em vez de criar.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha não conferem.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde um instante e tente de novo.';
    case 'auth/network-request-failed':
      return 'Sem conexão com o servidor. Verifique sua internet.';
    case 'auth/popup-closed-by-user':
      return 'A janela do Google foi fechada antes de concluir.';
    case 'auth/operation-not-allowed':
      return 'Esse método de login não está habilitado no console do Firebase (Authentication → Sign-in method).';
    case 'auth/configuration-not-found':
      return 'Authentication não está configurado neste projeto do Firebase. Habilite E-mail/senha no console.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'A chave VITE_FIREBASE_API_KEY do .env.local não é válida para este projeto.';
    default:
      return 'Não foi possível concluir. Tente de novo.';
  }
}
