import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

/**
 * Botão.
 *
 * O movimento aqui é resposta, não enfeite: afundar levemente ao toque é o
 * que faz o botão parecer que registrou o clique antes mesmo de a tela mudar.
 * Precisa ser rápido — 90ms — senão vira lentidão em vez de retorno.
 *
 * A elevação sobe no hover e some no toque, na mesma direção do dedo. Nada
 * disso sobrevive a `prefers-reduced-motion`, que zera as transições.
 */
const base =
  'inline-flex items-center justify-center gap-2 rounded-sm font-medium ' +
  'transition-[background-color,box-shadow,transform,opacity] ' +
  'duration-[--ease-snap] ease-[--ease-out] ' +
  'active:scale-[0.97] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

const variants: Record<Variant, string> = {
  primary: 'bg-acao text-paper shadow-raised hover:bg-acao-hover hover:shadow-float active:shadow-none',
  secondary:
    'border border-rule-strong bg-paper-raised text-ink hover:border-ink-faint hover:bg-paper-sunken',
  ghost: 'text-ink-soft hover:bg-paper-sunken hover:text-ink',
  danger: 'bg-saida text-paper shadow-raised hover:opacity-90 hover:shadow-float active:shadow-none',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-11 px-4 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
