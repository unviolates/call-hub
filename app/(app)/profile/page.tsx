import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateProfile } from '@/app/actions/profile';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  async function handleAction(formData: FormData) {
    'use server';
    await updateProfile(formData);
    redirect('/settings');
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <form action={handleAction} className="space-y-6 bg-[var(--bg)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
        
        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input 
            type="text" 
            name="display_name" 
            defaultValue={profile?.display_name || ''} 
            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-transparent input-ring" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input 
            type="text" 
            name="username" 
            defaultValue={profile?.username || ''} 
            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-transparent input-ring" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Avatar URL</label>
          <input 
            type="text" 
            name="avatar_url" 
            defaultValue={profile?.avatar_url || ''} 
            placeholder="https://example.com/avatar.png"
            className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-transparent input-ring" 
          />
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            name="verified" 
            value="true" 
            defaultChecked={profile?.verified} 
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
          />
          <label className="text-sm font-medium">Add Blue Tick (Verified)</label>
        </div>

        <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          Save Changes
        </button>
      </form>
    </div>
  );
}