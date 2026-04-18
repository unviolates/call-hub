'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/modal';
import { Button, IconButton } from '@/components/ui/button';
import { IconX, IconMusic, IconNotes, IconSmile } from '@/components/icons';
import { useMe } from '@/components/app-shell';
import { Avatar } from '@/components/ui/avatar';

const BG_PRESETS = [
  { label: 'Blue', value: '#2563EB', text: '#FFFFFF' },
  { label: 'Purple', value: '#7C3AED', text: '#FFFFFF' },
  { label: 'Pink', value: '#EC4899', text: '#FFFFFF' },
  { label: 'Red', value: '#EF4444', text: '#FFFFFF' },
  { label: 'Orange', value: '#F97316', text: '#FFFFFF' },
  { label: 'Amber', value: '#F59E0B', text: '#1F2937' },
  { label: 'Green', value: '#10B981', text: '#FFFFFF' },
  { label: 'Teal', value: '#14B8A6', text: '#FFFFFF' },
  { label: 'Cyan', value: '#06B6D4', text: '#FFFFFF' },
  { label: 'Indigo', value: '#6366F1', text: '#FFFFFF' },
  { label: 'Slate', value: '#1F2937', text: '#FFFFFF' },
  { label: 'Cream', value: '#FEF3C7', text: '#78350F' },
];

const EMOJI_QUICK = ['😀', '😂', '😍', '🥰', '😎', '🤩', '🥳', '😭', '🔥', '❤️', '✨', '🎉', '👏', '🙌', '💯', '💀', '👀', '☕', '🌸', '🎵'];

export function NoteComposer({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const router = useRouter();
  const [tab, setTab] = useState<'text' | 'music'>('text');
  const [text, setText] = useState('');
  const [emoji, setEmoji] = useState<string | null>(null);
  const [bg, setBg] = useState(BG_PRESETS[0]);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post() {
    if (tab === 'text' && !text.trim() && !emoji) { setError('Add text or an emoji.'); return; }
    if (tab === 'music' && !songTitle.trim()) { setError('Add a song title.'); return; }
    setPosting(true);
    setError(null);

    const supabase = createClient();

    // Delete existing note (one active note per user, like Instagram)
    await supabase.from('notes').delete().eq('user_id', me.id);

    const { error } = await supabase.from('notes').insert({
      user_id: me.id,
      kind: tab,
      text: tab === 'text' ? text.trim() || null : null,
      emoji,
      bg_color: bg.value, text_color: bg.text,
      song_title: tab === 'music' ? songTitle.trim() : null,
      song_artist: tab === 'music' ? songArtist.trim() || null : null,
    });

    setPosting(false);
    if (error) { setError(error.message); return; }
    router.refresh();
    onClose();
  }

  return (
    <Modal open onClose={onClose} padding={0} width={520}>
      <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[17px] font-semibold m-0">Leave a note</h3>
        <IconButton onClick={onClose}><IconX size={18} /></IconButton>
      </div>

      <div className="px-6 py-6 flex flex-col items-center gap-6">
        {/* Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-[22px] rounded-bl-md min-w-[180px] max-w-[240px] p-5 flex flex-col items-center justify-center gap-2 shadow-lg"
            style={{ background: bg.value, color: bg.text, minHeight: 110 }}>
            {emoji && <div className="text-3xl leading-none">{emoji}</div>}
            {tab === 'music' ? (
              <div className="flex items-center gap-2">
                <IconMusic size={16} />
                <div className="text-center">
                  <div className="text-sm font-semibold">{songTitle || 'Song title'}</div>
                  {songArtist && <div className="text-[11px] opacity-80">{songArtist}</div>}
                </div>
              </div>
            ) : (
              <div className="text-[14px] text-center font-medium whitespace-pre-wrap">
                {text || (emoji ? '' : 'Share a thought...')}
              </div>
            )}
          </div>
          <Avatar user={me} size={56} ring />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--bg-2)] rounded-full p-1">
          <button onClick={() => setTab('text')}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-all"
            style={{ background: tab === 'text' ? 'var(--bg)' : 'transparent', color: tab === 'text' ? 'var(--accent)' : 'var(--text-2)' }}>
            <IconNotes size={14} /> Text
          </button>
          <button onClick={() => setTab('music')}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium flex items-center gap-1.5 transition-all"
            style={{ background: tab === 'music' ? 'var(--bg)' : 'transparent', color: tab === 'music' ? 'var(--accent)' : 'var(--text-2)' }}>
            <IconMusic size={14} /> Music
          </button>
        </div>

        {/* Inputs */}
        {tab === 'text' ? (
          <div className="w-full">
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={60}
              placeholder="Share a thought..."
              className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none" />
            <div className="text-[11px] text-[var(--text-2)] mt-1 text-right">{text.length}/60</div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Song title"
              className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none" />
            <input value={songArtist} onChange={(e) => setSongArtist(e.target.value)}
              placeholder="Artist (optional)"
              className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none" />
          </div>
        )}

        {/* Emoji */}
        <div className="w-full">
          <div className="text-[11px] text-[var(--text-2)] font-medium uppercase tracking-wider mb-2">Add emoji</div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setEmoji(null)}
              className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--text-2)]"
              style={{ background: emoji === null ? 'var(--hover)' : 'transparent' }}>
              <IconX size={14} />
            </button>
            {EMOJI_QUICK.map((e) => (
              <button key={e} onClick={() => setEmoji(e)}
                className="w-9 h-9 rounded-full text-xl flex items-center justify-center"
                style={{ background: emoji === e ? 'color-mix(in oklab, var(--accent) 15%, transparent)' : 'transparent' }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="w-full">
          <div className="text-[11px] text-[var(--text-2)] font-medium uppercase tracking-wider mb-2">Background</div>
          <div className="flex gap-2 flex-wrap">
            {BG_PRESETS.map((p) => (
              <button key={p.value} onClick={() => setBg(p)} title={p.label}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{
                  background: p.value,
                  border: bg.value === p.value ? '2px solid var(--text)' : '1px solid var(--border)',
                  boxShadow: bg.value === p.value ? '0 0 0 2px var(--bg)' : 'none',
                }} />
            ))}
          </div>
        </div>

        {error && <div className="text-red-500 text-[13px] w-full text-center">{error}</div>}
      </div>

      <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={post} disabled={posting}>{posting ? 'Posting…' : 'Share note'}</Button>
      </div>
    </Modal>
  );
}
