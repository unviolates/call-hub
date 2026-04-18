'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { Button, IconButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconSend, IconPaperclip } from '@/components/icons';
import type { User, Message } from '@/types';

export default function ChatPage() {
  const params = useParams();
  const userId = params.id as string;
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadChat();
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChat() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      setOtherUser(userData);

      const { data: msgData } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      setMessages(msgData || []);

      // Mark as read
      await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', userId);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: msg } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: userId,
          content: newMessage,
        })
        .select()
        .single();

      if (msg) {
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border)]">
        {otherUser && <UserAvatar user={otherUser} size={40} />}
        <div className="flex-1">
          <div className="font-semibold">{otherUser?.display_name || otherUser?.full_name}</div>
          <div className="text-xs text-[var(--text-2)]">@{otherUser?.username}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-2)]">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-2)] text-[var(--text)]'
                  }`}
                >
                  {msg.content && <p className="text-sm">{msg.content}</p>}
                  {msg.media_url && (
                    <img src={msg.media_url} alt="Message" className="max-w-xs rounded" />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)] flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          leftIcon={<IconPaperclip size={16} />}
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          className="px-4"
        >
          <IconSend size={16} />
        </Button>
      </div>
    </div>
  );
}
