'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button, IconButton } from '@/components/ui/button';
import { IconMail, IconLock, IconEye, IconEyeOff, Logomark } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push('/chats');
    router.refresh();
  }

  return (
    <div className="animate-fade-scale-in bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-md p-8">
      <div className="flex items-center gap-2.5 mb-6">
        <Logomark size={28} />
        <span className="font-semibold text-lg tracking-tight">Callhub</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Welcome back</h1>
      <p className="text-[var(--text-2)] text-sm mb-6">Sign in to continue to your conversations.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Input label="Email" leftIcon={<IconMail size={16} />}
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com" />
        <Input label="Password" leftIcon={<IconLock size={16} />}
          type={show ? 'text' : 'password'} required value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
          rightEl={
            <IconButton type="button" size={30} onClick={() => setShow((s) => !s)}>
              {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </IconButton>
          } />
        {error && <div className="text-[13px] text-red-500">{error}</div>}
        <Button type="submit" size="lg" full className="mt-2" disabled={loading}>
          {loading ? 'Signing in…' : 'Log in'}
        </Button>
      </form>

      <div className="text-center mt-5 text-[13px] text-[var(--text-2)]">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[var(--accent)]">Sign up</Link>
      </div>
    </div>
  );
}
