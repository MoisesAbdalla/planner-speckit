import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { useId } from 'react';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children(id, messageId)}
      {error ? (
        <p id={messageId} role="alert" className="text-xs text-saida">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  'h-11 w-full rounded-sm border bg-paper-raised px-3 text-base text-ink ' +
  'placeholder:text-ink-faint transition-colors';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  /** Valores monetários e datas usam a coluna tabular. */
  figures?: boolean;
}

export function Input({ label, hint, error, figures = false, className = '', ...rest }: InputProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${controlClass} ${error ? 'border-saida' : 'border-rule-strong'} ${
            figures ? 'figures' : ''
          } ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, hint, error, className = '', children, ...rest }: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${controlClass} ${error ? 'border-saida' : 'border-rule-strong'} ${className}`}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}
