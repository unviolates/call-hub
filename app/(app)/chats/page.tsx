'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { IconSearch, IconPlus } from '@/components/icons';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';

interface Conversation {
  user: User;
  lastMessage: string | null;
  lastMessageTime: string;
  unread: boolean;
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadConversations();
    const channel = supabase
      .channel('direct_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        loadConversations();
      })
      .subscribe();
    return () => {
      void channel.unsubscribe();
    };
  }, []);

  async function loadConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages) {
        setConversations([]);
        return;
      }

      const uniqueUsers = new Map<string, Conversation>();
      for (const msg of messages) {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        if (!uniqueUsers.has(otherId)) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', otherId)
            .single();
          if (userData) {
            uniqueUsers.set(otherId, {
              user: userData,
              lastMessage: msg.content || (msg.media_url ? '📸 Media' : null),
              lastMessageTime: msg.created_at,
              unread: !msg.read_at && msg.recipient_id === user.id,
            });
          }
        }
      }
      setConversations(Array.from(uniqueUsers.values()).sort((a, b) =>
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      ));
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = conversations.filter(conv =>
    conv.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Link href="/search" className="p-2 hover:bg-[var(--bg-2)] rounded-lg transition">
          <IconPlus size={20} />
        </Link>
      </div>

      <Input
        leftIcon={<IconSearch size={16} />}
        placeholder="Search conversations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-2)]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-2)]">
            {conversations.length === 0 ? 'No conversations yet' : 'No results found'}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((conv) => (
              <Link
                key={conv.user.id}
                href={`/chats/${conv.user.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-2)] transition-colors"
              >
                <UserAvatar user={conv.user} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{conv.user.display_name || conv.user.full_name}</div>
                  <div className="text-xs text-[var(--text-2)] truncate">
                    {conv.lastMessage || 'No messages'}
                  </div>
                </div>
                {conv.unread && <div className="w-2 h-2 bg-[var(--accent)] rounded-full" />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
