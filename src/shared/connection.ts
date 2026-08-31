import { useEffect, useState } from 'react';

/**
 * Estado da conexão (FR-021). O SDK do Firestore enfileira as escritas
 * offline e reenvia ao reconectar; o papel daqui é contar isso para a pessoa,
 * em vez de deixar a interface parecer travada.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
