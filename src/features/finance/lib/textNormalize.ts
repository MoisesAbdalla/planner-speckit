/**
 * A normalização **única** da feature.
 *
 * Existe uma só porque `Padaria`, `padaria ` e `padaría` precisam ser a mesma
 * chave em todos os lugares: se o histórico normalizasse de um jeito e o
 * dicionário de outro, a memória de categorias se dividiria em variantes e
 * pareceria simplesmente não funcionar.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s,./-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Divide em palavras já normalizadas, descartando vazios. */
export function words(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}
