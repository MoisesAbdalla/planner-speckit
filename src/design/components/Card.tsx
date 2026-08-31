import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-md border border-rule bg-paper-raised shadow-raised ${className}`}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  action?: ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
      <h2 className="text-lg">{title}</h2>
      {action}
    </header>
  );
}

/** Rótulo de coluna do razão: maiúsculas pequenas, discretas, sempre acima do dado. */
export function ColumnLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-micro font-medium uppercase tracking-[0.08em] text-ink-faint">
      {children}
    </span>
  );
}
