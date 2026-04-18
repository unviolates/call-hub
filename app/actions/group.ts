'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createGroup(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const userIdsStr = formData.get('userIds') as string;
  const userIds = userIdsStr ? userIdsStr.split(',') : [];

  if (!name || userIds.length === 0) {
    return { error: 'Name and members are required' };
  }

  // Add the current user to the group members
  if (!userIds.includes(user.id)) {
    userIds.push(user.id);
  }

  // 1. Create the conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      is_group: true,
      name,
      created_by: user.id
    })
    .select()
    .single();

  if (convError || !conversation) return { error: convError?.message || 'Failed to create group' };

  // 2. Add members
  const membersData = userIds.map(id => ({
    conversation_id: conversation.id,
    user_id: id,
    role: id === user.id ? 'admin' : 'member'
  }));

  const { error: membersError } = await supabase
    .from('conversation_members')
    .insert(membersData);

  if (membersError) return { error: membersError.message };

  revalidatePath('/groups');
  return { success: true, conversationId: conversation.id };
}