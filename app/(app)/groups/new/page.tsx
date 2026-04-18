'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@/components/icons';
import Link from 'next/link';

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function createGroup() {
    if (!name.trim()) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name,
          description: description || null,
          creator_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator to group
      await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      router.push(`/groups/${group.id}`);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
        <Link href="/groups">
          <Button size="sm" variant="secondary">
            <IconArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Group</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Input
          label="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter group name"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Group description (optional)"
          className="w-full h-24 p-4 rounded-lg border border-[var(--border)] bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        <Button
          onClick={createGroup}
          disabled={loading || !name.trim()}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Create Group'}
        </Button>
      </div>
    </div>
  );
}
