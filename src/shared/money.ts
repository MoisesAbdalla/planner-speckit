/**
 * Dinheiro é sempre inteiro em centavos (Princípio IV da constituição).
 * Nenhuma operação aqui usa ponto flutuante para chegar aos centavos: a
 * conversão é feita sobre a string digitada, dígito a dígito.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DECIMAL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "R$ 1.234,56" — formato de exibição em toda a interface (FR-012). */
export function formatCents(cents: number): string {
  return BRL.format(cents / 100);
}

/** "1.234,56" — sem o símbolo, para colunas onde R$ já está no cabeçalho. */
export function formatCentsPlain(cents: number): string {
  return DECIMAL.format(cents / 100);
}

/** "+R$ 50,00" / "−R$ 50,00" — usa o menos tipográfico, que alinha com os dígitos. */
export function formatCentsSigned(cents: number): string {
  if (cents === 0) return formatCents(0);
  const sign = cents > 0 ? '+' : '−';
  return `${sign}${formatCents(Math.abs(cents))}`;
}

/** Preenche um campo de edição a partir do valor guardado: 123456 → "1234,56". */
export function centsToInputValue(cents: number): string {
  const abs = Math.abs(cents);
  const reais = Math.floor(abs / 100);
  const centavos = String(abs % 100).padStart(2, '0');
  return `${cents < 0 ? '-' : ''}${reais},${centavos}`;
}

/**
 * Converte o que a pessoa digitou em centavos.
 * Aceita "50", "1234,5", "1.234,56", "R$ 1.234,56" e "1234.56".
 * Devolve `null` quando não há número válido — quem chama decide a mensagem.
 */
export function parseAmountToCents(input: string): number | null {
  const cleaned = input
    .replace(/R\$/gi, '')
    .replace(/[\s\u00A0\u202F]/g, '')
    .trim();

  if (cleaned === '') return null;
  if (!/^-?[\d.,]+$/.test(cleaned)) return null;

  const negative = cleaned.startsWith('-');
  const digitsOnly = negative ? cleaned.slice(1) : cleaned;

  const lastComma = digitsOnly.lastIndexOf(',');
  const lastDot = digitsOnly.lastIndexOf('.');
  let decimalSeparator: ',' | '.' | null = null;

  if (lastComma >= 0 && lastDot >= 0) {
    // O separador decimal é sempre o que aparece por último.
    decimalSeparator = lastComma > lastDot ? ',' : '.';
  } else if (lastComma >= 0) {
    decimalSeparator = ',';
  } else if (lastDot >= 0) {
    // Sozinho, "." pode ser milhar ("1.500") ou decimal ("1.50").
    // Três dígitos depois do ponto é milhar; qualquer outra coisa é decimal.
    const afterDot = digitsOnly.slice(lastDot + 1);
    decimalSeparator = afterDot.length === 3 ? null : '.';
  }

  let integerPart: string;
  let fractionPart: string;

  if (decimalSeparator === null) {
    integerPart = digitsOnly.replace(/[.,]/g, '');
    fractionPart = '';
  } else {
    const cut = digitsOnly.lastIndexOf(decimalSeparator);
    integerPart = digitsOnly.slice(0, cut).replace(/[.,]/g, '');
    fractionPart = digitsOnly.slice(cut + 1).replace(/[.,]/g, '');
  }

  if (integerPart === '' && fractionPart === '') return null;
  if (!/^\d*$/.test(integerPart) || !/^\d*$/.test(fractionPart)) return null;

  const centavos = (fractionPart + '00').slice(0, 2);
  const total = Number(`${integerPart || '0'}${centavos}`);

  if (!Number.isSafeInteger(total)) return null;
  return negative ? -total : total;
}

/** FR-011: movimentação precisa de valor positivo. */
export function isValidAmount(cents: number | null): cents is number {
  return cents !== null && Number.isSafeInteger(cents) && cents > 0;
}
