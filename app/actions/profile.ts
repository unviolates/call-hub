'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const updates: any = {};
  if (formData.has('display_name')) updates.display_name = formData.get('display_name');
  if (formData.has('username')) updates.username = formData.get('username');
  if (formData.has('avatar_url')) updates.avatar_url = formData.get('avatar_url');
  
  updates.verified = formData.get('verified') === 'true'; // Set true if checked, false otherwise

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
  if (error) {
    console.error(error.message);
    return { error: error.message };
  }
  return { success: true };
}