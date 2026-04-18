'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Button, IconButton } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { IconX, IconMusic, IconSend, VerifyBadge } from '@/components/icons';
import { createClient } from '@/lib/supabase/client';
import { useMe } from '@/components/app-shell';
import type { Note, Profile } from '@/lib/supabase/types';

type NoteWithProfile = Note & { profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'> };
const QUICK_REACT = ['❤️', '🔥', '😂', '😮', '👏', '🙏'];

export function NoteReplyModal({ note, onClose }: { note: NoteWithProfile; onClose: () => void }) {
  const router = useRouter();
  const me = useMe();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function sendReply(body: string) {
    if (!body.trim() || sending) return;
    setSending(true);
    const supabase = createClient();

    // Get or create DM with note author
    const { data: convId, error: convErr } = await supabase.rpc('get_or_create_dm', { other_user: note.profiles.id });
    if (convErr || !convId) { alert(convErr?.message ?? 'Failed'); setSending(false); return; }

    // Send the message with note quote context
    const quotedPreview = note.kind === 'music'
      ? `🎵 ${note.song_title}${note.song_artist ? ` — ${note.song_artist}` : ''}`
      : `"${note.emoji ?? ''} ${note.text ?? ''}".trim()`;

    await supabase.from('messages').insert({
      conversation_id: convId as string,
      sender_id: me.id,
      body: `Re: ${quotedPreview.replace('".trim()', '"')}\n\n${body}`,
    });

    await supabase.from('note_replies').insert({
      note_id: note.id, sender_id: me.id, body,
    });

    setSending(false);
    onClose();
    router.push(`/chats/${convId}`);
  }

  async function react(emoji: string) {
    const supabase = createClient();
    await supabase.from('note_reactions').upsert({ note_id: note.id, user_id: me.id, emoji });
    await sendReply(emoji);
  }

  return (
    <Modal open onClose={onClose} padding={0} width={420}>
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar user={note.profiles} size={32} />
          <div>
            <div className="flex items-center gap-1 text-[13px] font-semibold">
              {note.profiles.display_name}
              {note.profiles.verified && <VerifyBadge size={11} />}
            </div>
            <div className="text-[11px] text-[var(--text-2)]">@{note.profiles.username}</div>
          </div>
        </div>
        <IconButton onClick={onClose}><IconX size={18} /></IconButton>
      </div>

      <div className="px-6 py-6 flex flex-col items-center gap-4">
        <div className="rounded-[22px] rounded-bl-md min-w-[180px] max-w-[280px] p-5 flex flex-col items-center gap-2 shadow-md"
          style={{ background: note.bg_color, color: note.text_color, minHeight: 100 }}>
          {note.emoji && <div className="text-2xl">{note.emoji}</div>}
          {note.kind === 'music' ? (
            <div className="flex items-center gap-2">
              <IconMusic size={14} />
              <div className="text-center">
                <div className="text-[13px] font-semibold">{note.song_title}</div>
                {note.song_artist && <div className="text-[11px] opacity-80">{note.song_artist}</div>}
              </div>
            </div>
          ) : (
            <div className="text-[14px] text-center font-medium whitespace-pre-wrap">{note.text}</div>
          )}
        </div>

        <div className="flex gap-1.5">
          {QUICK_REACT.map((e) => (
            <button key={e} onClick={() => react(e)}
              className="w-10 h-10 rounded-full text-xl hover:scale-110 transition-transform"
              style={{ background: 'var(--bg-2)' }}>{e}</button>
          ))}
        </div>

        <div className="w-full flex items-center gap-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-full px-4 py-2">
          <input value={reply} onChange={(e) => setReply(e.target.value)}
            placeholder={`Reply to ${note.profiles.display_name.split(' ')[0]}...`}
            onKeyDown={(e) => e.key === 'Enter' && sendReply(reply)}
            className="flex-1 bg-transparent outline-none text-sm" />
          <button onClick={() => sendReply(reply)} disabled={!reply.trim() || sending}
            className="w-8 h-8 rounded-full bg-[var(--accent)] text-white inline-flex items-center justify-center disabled:opacity-40">
            <IconSend size={14} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
