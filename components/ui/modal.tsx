'use client';

import { useEffect } from 'react';

export function Modal({
  open, onClose, children, width = 480, padding = 24,
}: { open: boolean; onClose: () => void; children: React.ReactNode; width?: number; padding?: number }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: 'color-mix(in oklab, var(--text) 30%, transparent)',
        backdropFilter: 'blur(14px) saturate(120%)',
        WebkitBackdropFilter: 'blur(14px) saturate(120%)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[var(--bg)] rounded-2xl border border-[var(--border)] shadow-lg animate-fade-scale-in max-h-[90vh] overflow-auto"
        style={{ maxWidth: width, padding }}
      >
        {children}
      </div>
    </div>
  );
}
