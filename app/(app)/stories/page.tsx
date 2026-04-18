import { createClient } from '@/lib/supabase/server';
import { StoriesScreen } from '@/components/stories/stories-screen';

export const dynamic = 'force-dynamic';

export default async function StoriesPage() {
  const supabase = createClient();
  const { data: stories } = await supabase
    .from('stories')
    .select('*, profiles:user_id(id, username, display_name, avatar_url, verified)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return <StoriesScreen stories={(stories ?? []) as any} />;
}
