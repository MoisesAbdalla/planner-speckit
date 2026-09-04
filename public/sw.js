/*
 * O service worker existe para o app **abrir** sem internet.
 *
 * O cache do Firestore já guarda os dados no aparelho, mas sem isto aqui o
 * navegador ainda precisa buscar o index.html e os scripts na rede para o app
 * começar. Offline, ele falha antes de chegar aos dados — o cache fica cheio
 * e sem ninguém para lê-lo.
 *
 * Duas armadilhas conhecidas de service worker estão tratadas de propósito:
 *
 * 1. **Prender a pessoa numa versão velha.** A navegação usa rede primeiro e
 *    cache só como rede de segurança. Online, você sempre recebe a versão
 *    nova; offline, a última que funcionou. Cache primeiro no HTML é o que
 *    faz apps ficarem congelados por semanas.
 *
 * 2. **Interceptar o que não é nosso.** Só requisições GET da mesma origem
 *    passam por aqui. Firestore, login do Google e qualquer outra API vão
 *    direto para a rede, sempre. Um service worker no meio do Firestore
 *    quebraria a sincronização de formas difíceis de diagnosticar.
 */

const CACHE = 'planner-app';

/** O mínimo para a tela abrir: a casca e o que ela pede antes do JavaScript. */
const CASCA = ['/', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // `catch` porque um item que falhe não pode impedir a instalação
      // inteira — melhor um service worker parcial do que nenhum.
      await Promise.all(CASCA.map((url) => cache.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Assume o controle das abas abertas agora, sem esperar que fechem.
      await self.clients.claim();
    })(),
  );
});

/** Rede primeiro; o cache responde só quando a rede não responde. */
async function redePrimeiro(request) {
  const cache = await caches.open(CACHE);
  try {
    const resposta = await fetch(request);
    // Toda navegação devolve o mesmo index.html (a regra de reescrita do
    // Hosting), então guardamos sob uma chave só: qualquer rota offline
    // encontra a casca.
    if (resposta.ok) cache.put('/', resposta.clone());
    return resposta;
  } catch (semRede) {
    const guardado = await cache.match('/');
    if (guardado) return guardado;
    throw semRede;
  }
}

/**
 * Cache primeiro — seguro **porque o nome do arquivo tem o hash do conteúdo**.
 * Se o conteúdo muda, o nome muda, e a versão velha nunca é servida no lugar
 * da nova.
 */
async function cachePrimeiro(request) {
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(request);
  if (guardado) return guardado;

  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Outra origem: Firestore, login, fontes. Passa direto, sempre.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(redePrimeiro(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cachePrimeiro(request));
  }

  // O resto (inclusive o próprio sw.js) segue o caminho normal do navegador.
});
