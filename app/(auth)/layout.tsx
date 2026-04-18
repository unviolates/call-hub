export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center p-6 overflow-auto relative"
      style={{ background: 'var(--bg)' }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 18% 22%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 50%),
            radial-gradient(circle at 82% 78%, color-mix(in oklab, var(--text) 6%, transparent), transparent 50%)`,
        }}
      />
      <div className="relative z-10 w-full max-w-[420px]">{children}</div>
    </div>
  );
}
