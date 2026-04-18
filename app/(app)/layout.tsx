import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let profile = await supabase
    .from('users').select('*').eq('id', user.id).single();

  if (profile.error || !profile.data) {
    // Create user profile if it doesn't exist
    const defaultProfile = {
      id: user.id,
      email: user.email || '',
      username: user.email?.split('@')[0] || 'user',
      full_name: user.user_metadata?.full_name || 'User',
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      bio: null,
      avatar_url: user.user_metadata?.avatar_url || null,
      cover_image_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from('users').insert(defaultProfile);
    return <AppShell profile={defaultProfile}>{children}</AppShell>;
  }

  return <AppShell profile={profile.data}>{children}</AppShell>;
}
