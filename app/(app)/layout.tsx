import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let { data: profile, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  if (error || !profile) {
    // Create user profile if it doesn't exist
    const defaultProfile = {
      id: user.id,
      username: user.email?.split('@')[0] || 'user',
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
      bio: '',
      avatar_url: user.user_metadata?.avatar_url || null,
      cover_url: null,
      verified: false,
      online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    await supabase.from('profiles').insert(defaultProfile);
    return <AppShell profile={defaultProfile}>{children}</AppShell>;
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
