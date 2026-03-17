import type { ReactNode } from 'react';

export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  className?: string;
}) {
  const variant = props.variant ?? 'primary';
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/70 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const styles =
    variant === 'primary'
      ? 'bg-primary hover:bg-primary/90 text-white hover:shadow-lg hover:shadow-primary/15'
      : variant === 'danger'
        ? 'bg-red-600 hover:bg-red-500 text-white hover:shadow-lg hover:shadow-red-500/15'
        : 'bg-transparent hover:bg-white/5 text-white border border-white/10 hover:border-white/20';
  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`${base} ${styles} ${props.className ?? ''}`}
    >
      {props.children}
    </button>
  );
}

