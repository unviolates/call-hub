'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { SearchBar } from '@/components/ui/input';
import { IconButton } from '@/components/ui/button';
import { IconEdit, IconPin, IconUsers, VerifyBadge } from '@/components/icons';
import { relativeTime } from '@/lib/utils';
import { NewMessageModal } from '@/components/chat/new-message-modal';
import { NewGroupModal } from '@/components/chat/new-group-modal';

export type ChatItem = {
  id: string;
  isGroup: boolean;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  online: boolean;
  verified: boolean;
  otherUserId: string | null;
  pinned: boolean;
  lastMessageAt: string;
  lastMessage: string;
  lastMessageFromMe: boolean;
  unread: number;
  membersCount: number;
};

export function ChatList({ chats, activeId }: { chats: ChatItem[]; activeId: string | null }) {
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);

  const filtered = chats.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
  });
  const pinned = filtered.filter((c) => c.pinned);
  const others = filtered.filter((c) => !c.pinned);

  return (
    <section className="w-full lg:w-[360px] lg:flex-shrink-0 h-full border-r-0 lg:border-r border-[var(--border)] flex flex-col"
      style={{ background: 'var(--bg)' }}>
      <div className="px-[18px] pt-[18px] pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold tracking-tight m-0">Messages</h2>
          <div className="flex gap-2">
            <IconButton title="New group" onClick={() => setNewGroupOpen(true)}><IconUsers size={18} /></IconButton>
            <IconButton title="New message" onClick={() => setNewOpen(true)}><IconEdit size={18} /></IconButton>
          </div>
        </div>
        <SearchBar value={query} onChange={setQuery} placeholder="Search conversations" />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {pinned.length > 0 && (
          <>
            <SectionLabel icon={<IconPin size={12} />}>Pinned</SectionLabel>
            {pinned.map((c) => <ChatRow key={c.id} chat={c} active={c.id === activeId} />)}
            <SectionLabel>All messages</SectionLabel>
          </>
        )}
        {others.map((c) => <ChatRow key={c.id} chat={c} active={c.id === activeId} />)}
        {filtered.length === 0 && (
          <div className="text-center text-[var(--text-2)] text-[13px] p-10">
            {query ? `No conversations match "${query}"` : 'No conversations yet. Start one with the pencil icon.'}
          </div>
        )}
      </div>

      <NewMessageModal open={newOpen} onClose={() => setNewOpen(false)} />
      <NewGroupModal open={newGroupOpen} onClose={() => setNewGroupOpen(false)} />
    </section>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-3.5 pt-3.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-2)]">
      {icon}<span>{children}</span>
    </div>
  );
}

function ChatRow({ chat, active }: { chat: ChatItem; active: boolean }) {
  return (
    <Link href={`/chats/${chat.id}`}
      className="ch-hover flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-left mb-0.5 transition-colors"
      style={{ background: active ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent' }}>
      <Avatar user={{ display_name: chat.name, avatar_url: chat.avatarUrl }} size={44} dot={chat.online} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm truncate" style={{ fontWeight: chat.unread > 0 ? 600 : 500 }}>{chat.name}</span>
          {chat.verified && <VerifyBadge size={12} />}
          <div className="flex-1" />
          <span className="text-[11.5px] flex-shrink-0"
            style={{ color: chat.unread ? 'var(--accent)' : 'var(--text-2)', fontWeight: chat.unread ? 600 : 400 }}>
            {relativeTime(chat.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="flex-1 text-[13px] truncate"
            style={{ color: chat.unread > 0 ? 'var(--text)' : 'var(--text-2)', fontWeight: chat.unread > 0 ? 500 : 400 }}>
            {chat.lastMessageFromMe && <span className="text-[var(--text-2)]">You: </span>}
            {chat.lastMessage || <span className="italic">No messages yet</span>}
          </span>
          {chat.unread > 0 && (
            <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[var(--accent)] text-white text-[10.5px] font-semibold inline-flex items-center justify-center">
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
