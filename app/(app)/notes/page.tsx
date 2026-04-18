import { createClient } from '@/lib/supabase/server';
import { NotesScreen } from '@/components/notes/notes-screen';

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: notes } = await supabase
    .from('notes')
    .select('*, profiles:user_id(id, username, display_name, avatar_url, verified)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  const myNote = (notes ?? []).find((n: any) => n.user_id === user?.id) ?? null;
  const otherNotes = (notes ?? []).filter((n: any) => n.user_id !== user?.id);

  return <NotesScreen myNote={myNote as any} otherNotes={otherNotes as any} />;
}
