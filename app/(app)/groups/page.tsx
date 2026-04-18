'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { IconPlus } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { ChatGroup } from '@/types';

export default function GroupsPage() {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (!memberData || memberData.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberData.map(m => m.group_id);
      const { data: groupsData } = await supabase
        .from('chat_groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      setGroups(groupsData || []);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Link href="/groups/new" className="p-2 hover:bg-[var(--bg-2)] rounded-lg transition">
          <IconPlus size={20} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">Loading groups...</div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-2)]">
            <div className="text-center">
              <p className="mb-4">You haven&apos;t joined any groups yet</p>
              <Link href="/groups/new">
                <Button>Create a Group</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-[var(--border)]">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="flex items-center gap-3 p-4 hover:bg-[var(--bg-2)] transition"
              >
                {group.avatar_url ? (
                  <img
                    src={group.avatar_url}
                    alt={group.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{group.name}</div>
                  {group.description && (
                    <div className="text-sm text-[var(--text-2)] truncate">
                      {group.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
