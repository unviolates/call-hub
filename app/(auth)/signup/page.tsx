'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button, IconButton } from '@/components/ui/button';
import { IconMail, IconLock, IconEye, IconEyeOff, IconUser, Logomark } from '@/components/icons';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          display_name: name,
          username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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
      <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Create your account</h1>
      <p className="text-[var(--text-2)] text-sm mb-6">A quieter place to message the people who matter.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
        <Input label="Name" leftIcon={<IconUser size={16} />}
          required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <Input label="Username" leftIcon={<IconUser size={16} />}
          required value={username} onChange={(e) => setUsername(e.target.value)}
          placeholder="lowercase, no spaces" pattern="[a-zA-Z0-9_]{3,20}" />
        <Input label="Email" leftIcon={<IconMail size={16} />}
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com" />
        <Input label="Password" leftIcon={<IconLock size={16} />}
          type={show ? 'text' : 'password'} required value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
          rightEl={
            <IconButton type="button" size={30} onClick={() => setShow((s) => !s)}>
              {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </IconButton>
          } />
        <Input label="Confirm password" leftIcon={<IconLock size={16} />}
          type={show ? 'text' : 'password'} required value={confirm}
          onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />

        {error && <div className="text-[13px] text-red-500">{error}</div>}
        <Button type="submit" size="lg" full className="mt-2" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="text-center mt-5 text-[13px] text-[var(--text-2)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--accent)]">Log in</Link>
      </div>
    </div>
  );
}
