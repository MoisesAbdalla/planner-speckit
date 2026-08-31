import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from 'firebase/auth';
import { auth } from '../../../firebase';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/** Falhas do popup em que vale tentar o redirect; nas demais, o erro é real. */
const REDIRECT_FALLBACK = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);

/**
 * Login com Google, popup primeiro — inclusive no celular.
 *
 * O redirect parece a escolha natural em telas pequenas, mas ele depende de
 * ler o estado do login de volta no retorno; quando o app e o `authDomain`
 * estão em domínios diferentes, os navegadores bloqueiam essa leitura e a
 * pessoa volta para a tela de login sem explicação. O popup devolve a
 * credencial pela própria janela e não cai nesse problema.
 */
export async function signInWithGoogle(): Promise<UserCredential | void> {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    if (REDIRECT_FALLBACK.has(code)) {
      return signInWithRedirect(auth, provider);
    }
    throw error;
  }
}

/**
 * Conclui um login que voltou por redirect.
 *
 * Precisa ser chamado quando o app carrega: sem isso, um retorno de redirect
 * fica pendente e o erro nunca aparece para ninguém.
 */
export async function completePendingRedirect(): Promise<UserCredential | null> {
  return getRedirectResult(auth);
}
