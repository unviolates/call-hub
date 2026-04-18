'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { IconSearch, IconMessageSquare, IconUserPlus } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [following, setFollowing] = useState(new Set<string>());
  const supabase = createClient();

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        loadFollowing(user.id);
      }
    };
    initUser();
  }, []);

  async function loadFollowing(userId: string) {
    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);
    if (data) {
      setFollowing(new Set(data.map(f => f.following_id)));
    }
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
      return;
    }

    searchUsers();
  }, [searchTerm]);

  async function searchUsers() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('users')
        .select('*')
        .or(
          `full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`
        )
        .neq('id', currentUserId)
        .limit(20);

      setUsers(data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow(userId: string, isFollowing: boolean) {
    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          });
        setFollowing(prev => new Set([...prev, userId]));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold mb-4">Search & Add Friends</h1>
        <Input
          leftIcon={<IconSearch size={16} />}
          placeholder="Search by name or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">Searching...</div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-2)]">
            {searchTerm ? 'No users found' : 'Start searching for users'}
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-[var(--border)]">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-[var(--bg-2)] transition">
                <UserAvatar user={user} size={48} />
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.id}`}>
                    <div className="font-semibold text-sm hover:underline">
                      {user.display_name || user.full_name}
                    </div>
                    <div className="text-xs text-[var(--text-2)]">@{user.username}</div>
                    {user.bio && <p className="text-xs text-[var(--text-2)] truncate mt-1">{user.bio}</p>}
                  </Link>
                </div>
                <div className="flex gap-2">
                  <Link href={`/chats/${user.id}`}>
                    <Button size="sm" className="px-3">
                      <IconMessageSquare size={16} />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="px-3"
                    onClick={() => toggleFollow(user.id, following.has(user.id))}
                    variant={following.has(user.id) ? 'secondary' : 'primary'}
                  >
                    {following.has(user.id) ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
