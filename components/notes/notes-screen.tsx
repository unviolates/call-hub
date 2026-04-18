'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button, IconButton } from '@/components/ui/button';
import { IconPlus, IconX, IconMusic, VerifyBadge } from '@/components/icons';
import { NoteComposer } from '@/components/notes/note-composer';
import { NoteReplyModal } from '@/components/notes/note-reply-modal';
import { useMe } from '@/components/app-shell';
import type { Note, Profile } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';

type NoteWithProfile = Note & { profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'> };

export function NotesScreen({ myNote, otherNotes }: { myNote: NoteWithProfile | null; otherNotes: NoteWithProfile[] }) {
  const me = useMe();
  const router = useRouter();
  const [composer, setComposer] = useState(false);
  const [replying, setReplying] = useState<NoteWithProfile | null>(null);

  async function deleteMyNote() {
    if (!myNote || !confirm('Delete your note?')) return;
    const supabase = createClient();
    await supabase.from('notes').delete().eq('id', myNote.id);
    router.refresh();
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <header className="px-6 pt-[18px] pb-3.5 flex items-center justify-between sticky top-0 z-[2]"
        style={{ background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(12px)' }}>
        <div>
          <h2 className="text-xl font-semibold tracking-tight m-0">Notes</h2>
          <p className="text-[13px] text-[var(--text-2)] m-0 mt-1">Share a quick thought — disappears in 24 hours.</p>
        </div>
        {!myNote && <Button size="sm" icon={<IconPlus size={16} />} onClick={() => setComposer(true)}>Leave a note</Button>}
      </header>

      <div className="px-6 pb-10">
        <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider mb-3 mt-2">Your note</h3>
        <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {myNote ? (
            <div className="relative group">
              <NoteBubble note={myNote} you />
              <button onClick={deleteMyNote}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--bg)] border border-[var(--border)] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center">
                <IconX size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setComposer(true)}
              className="ch-hover h-[140px] rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-2)]"
              style={{ background: 'var(--bg-2)' }}>
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white inline-flex items-center justify-center">
                <IconPlus size={18} />
              </div>
              <div className="text-[13px] font-medium text-[var(--text)]">Leave a note</div>
              <div className="text-[11px]">Share with {me.display_name.split(' ')[0]}&apos;s friends</div>
            </button>
          )}
        </div>

        <h3 className="text-[13px] font-semibold text-[var(--text-2)] uppercase tracking-wider mb-3">Friends&apos; notes</h3>
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {otherNotes.map((n) => (
            <NoteBubble key={n.id} note={n} onClick={() => setReplying(n)} />
          ))}
          {otherNotes.length === 0 && (
            <div className="col-span-full text-center text-[var(--text-2)] text-[13px] py-10">
              No notes from friends yet.
            </div>
          )}
        </div>
      </div>

      {composer && <NoteComposer onClose={() => { setComposer(false); router.refresh(); }} />}
      {replying && <NoteReplyModal note={replying} onClose={() => setReplying(null)} />}
    </div>
  );
}

export function NoteBubble({ note, you, onClick }: { note: NoteWithProfile; you?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className="relative flex flex-col items-center gap-2 group text-left p-0 disabled:cursor-default">
      <div className="relative w-full">
        <div className="rounded-[22px] rounded-bl-md min-h-[110px] w-full p-4 flex flex-col items-center justify-center gap-2 shadow-md transition-transform group-hover:-translate-y-0.5"
          style={{
            background: note.bg_color.startsWith('gradient')
              ? `linear-gradient(135deg, ${note.bg_color})`
              : note.bg_color,
            color: note.text_color,
          }}>
          {note.emoji && <div className="text-2xl leading-none">{note.emoji}</div>}
          {note.kind === 'music' ? (
            <div className="flex items-center gap-1.5 w-full justify-center">
              <IconMusic size={14} />
              <div className="text-center">
                <div className="text-[13px] font-semibold leading-tight line-clamp-1">{note.song_title}</div>
                {note.song_artist && <div className="text-[11px] opacity-80 line-clamp-1">{note.song_artist}</div>}
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-center leading-snug whitespace-pre-wrap break-words line-clamp-4 font-medium">
              {note.text}
            </div>
          )}
        </div>
        {/* Speech tail */}
        <div className="absolute -bottom-1 left-3 w-3 h-3 rounded-full" style={{ background: note.bg_color.startsWith('gradient') ? '#667EEA' : note.bg_color }} />
        <div className="absolute -bottom-2.5 left-1 w-2 h-2 rounded-full" style={{ background: note.bg_color.startsWith('gradient') ? '#667EEA' : note.bg_color }} />
      </div>

      <div className="mt-2.5 flex flex-col items-center gap-1">
        <Avatar user={note.profiles} size={52} ring />
        <div className="flex items-center gap-1 max-w-[140px]">
          <span className="text-[12px] font-medium truncate">{you ? 'You' : note.profiles.display_name.split(' ')[0]}</span>
          {note.profiles.verified && <VerifyBadge size={10} />}
        </div>
      </div>
    </button>
  );
}
