'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/button';
import {
  IconArrowLeft, IconPhone, IconVideo, IconMoreVertical,
  IconPaperclip, IconSmile, IconSend, IconMic, IconCheck, IconCheckCheck,
  VerifyBadge,
} from '@/components/icons';
import type { Message } from '@/lib/supabase/types';
import { messageTime } from '@/lib/utils';

export function Conversation({
  conversationId, isGroup, name, username, avatarUrl, online, verified, membersCount,
  meId, initialMessages,
}: {
  conversationId: string;
  isGroup: boolean;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  online: boolean;
  verified: boolean;
  membersCount: number;
  meId: string;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(`conv:${conversationId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((cur) => {
            const m = payload.new as Message;
            if (cur.some((x) => x.id === m.id)) return cur;
            return [...cur, m];
          });
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((cur) => cur.map((x) => x.id === (payload.new as Message).id ? (payload.new as Message) : x));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';

    const supabase = createClient();
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: meId,
      body, attachment_url: null, attachment_type: null,
      reply_to: null, edited: false, deleted: false,
      created_at: new Date().toISOString(),
    };
    setMessages((cur) => [...cur, optimistic]);

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: meId, body })
      .select().single();

    setSending(false);

    if (error) {
      setMessages((cur) => cur.filter((m) => m.id !== optimistic.id));
      alert(error.message);
      return;
    }
    setMessages((cur) => cur.map((m) => m.id === optimistic.id ? (data as Message) : m));
  }

  function autoSize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    setText(el.value);
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <section className="flex-1 min-w-0 h-full flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="px-[18px] py-3 border-b border-[var(--border)] flex items-center gap-2.5"
        style={{ background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(12px)' }}>
        <IconButton className="lg:hidden" onClick={() => router.push('/chats')}><IconArrowLeft size={18} /></IconButton>
        <button className="ch-hover flex items-center gap-2.5 px-2 py-1 rounded-[10px] flex-1 text-left min-w-0">
          <Avatar user={{ display_name: name, avatar_url: avatarUrl }} size={36} dot={online} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[14.5px] font-semibold tracking-tight">{name}</span>
              {verified && <VerifyBadge size={13} />}
            </div>
            <div className="text-xs text-[var(--text-2)] mt-px">
              {isGroup ? `${membersCount} members` : (online ? 'Online' : 'Last seen recently')}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <IconButton title="Voice call"><IconPhone size={18} /></IconButton>
          <IconButton title="Video call"><IconVideo size={18} /></IconButton>
          <IconButton title="More"><IconMoreVertical size={18} /></IconButton>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col">
        <DayDivider label="Today" />
        {messages.map((m, i) => {
          const isMe = m.sender_id === meId;
          const next = messages[i + 1];
          const showTime = !next || next.sender_id !== m.sender_id ||
            (new Date(next.created_at).getTime() - new Date(m.created_at).getTime()) > 60_000;
          return <MessageBubble key={m.id} msg={m} isMe={isMe} showTime={showTime} />;
        })}
      </div>

      <div className="p-4 pt-3 border-t border-[var(--border)]">
        <div className="ch-input-wrap flex items-end gap-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl px-1.5 pr-1.5 pl-3 py-1.5 transition-all">
          <IconButton title="Attach"><IconPaperclip size={18} /></IconButton>
          <textarea
            ref={taRef} rows={1} value={text}
            onChange={autoSize} onKeyDown={onKey}
            placeholder={`Message ${name.split(' ')[0]}`}
            className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed py-2 px-1 max-h-[140px] min-h-[24px]"
          />
          <IconButton title="Emoji"><IconSmile size={18} /></IconButton>
          {text.trim() ? (
            <button onClick={send} disabled={sending}
              className="w-9 h-9 rounded-[10px] bg-[var(--accent)] text-white inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
              <IconSend size={16} />
            </button>
          ) : <IconButton title="Record"><IconMic size={18} /></IconButton>}
        </div>
      </div>
    </section>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-4 mt-1">
      <span className="text-[11px] font-medium text-[var(--text-2)] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--bg-2)]">
        {label}
      </span>
    </div>
  );
}

function MessageBubble({ msg, isMe, showTime }: { msg: Message; isMe: boolean; showTime: boolean }) {
  return (
    <div className="flex mb-1.5 animate-message-in" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
      <div className="max-w-[76%] flex flex-col" style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        <div className="px-3.5 py-2 rounded-2xl whitespace-pre-wrap break-words text-[14.5px] leading-relaxed"
          style={{
            background: isMe ? 'var(--bg)' : 'var(--bg-2)',
            border: isMe ? '1px solid var(--border)' : '1px solid transparent',
            borderBottomRightRadius: isMe ? 4 : 14,
            borderBottomLeftRadius: isMe ? 14 : 4,
          }}>
          {msg.body}
        </div>
        {showTime && (
          <div className="text-[11px] text-[var(--text-2)] mt-1 flex items-center gap-1"
            style={{ paddingLeft: isMe ? 0 : 6, paddingRight: isMe ? 6 : 0 }}>
            <span>{messageTime(msg.created_at)}</span>
            {isMe && <IconCheck size={13} />}
          </div>
        )}
      </div>
    </div>
  );
}
