import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Input({
  label, leftIcon, rightEl, className, ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; leftIcon?: ReactNode; rightEl?: ReactNode }) {
  return (
    <label className="block">
      {label && <div className="text-[13px] font-medium mb-1.5">{label}</div>}
      <div className="ch-input-wrap flex items-center bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] transition-all duration-200">
        {leftIcon && <div className="pl-3 text-[var(--text-2)] flex">{leftIcon}</div>}
        <input
          {...rest}
          className={cn('flex-1 bg-transparent border-none outline-none px-3.5 py-[11px] text-sm min-w-0', className)}
        />
        {rightEl && <div className="pr-2">{rightEl}</div>}
      </div>
    </label>
  );
}

export function Textarea({
  label, className, ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <div className="text-[13px] font-medium mb-1.5">{label}</div>}
      <textarea
        {...rest}
        className={cn('w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-[10px] px-3.5 py-2.5 text-sm resize-y min-h-[72px] outline-none transition-all', className)}
      />
    </label>
  );
}

export function SearchBar({
  value, onChange, placeholder = 'Search',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="ch-input-wrap flex items-center gap-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-full px-3.5 py-2">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ color: 'var(--text-2)' }}>
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-[13.5px]"
      />
    </div>
  );
}
