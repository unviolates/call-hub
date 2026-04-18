import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary', size = 'md', icon, iconRight, full, className, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; size?: Size; icon?: ReactNode; iconRight?: ReactNode; full?: boolean;
}) {
  const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-[15px]',
  };
  const variants: Record<Variant, string> = {
    primary: 'bg-[var(--accent)] text-white border border-[var(--accent)] hover:brightness-110 active:translate-y-px',
    secondary: 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--hover)]',
    ghost: 'text-[var(--text)] hover:bg-[var(--hover)]',
    danger: 'text-red-600 border border-[var(--border)] hover:bg-red-500/10',
  };
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[10px] transition-all duration-200 whitespace-nowrap select-none disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size], variants[variant], full && 'w-full', className,
      )}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

export function IconButton({
  children, size = 36, active, title, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: number; active?: boolean }) {
  return (
    <button
      {...rest}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-[10px] transition-all duration-200',
        active ? 'text-[var(--accent)]' : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--hover)]',
        className,
      )}
      style={{ width: size, height: size, background: active ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : undefined }}
    >{children}</button>
  );
}
