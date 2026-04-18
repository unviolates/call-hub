'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/modal';
import { Button, IconButton } from '@/components/ui/button';
import { IconX, IconImage } from '@/components/icons';
import { useMe } from '@/components/app-shell';

export function StoryUploader({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function post() {
    if (!file) { setError('Pick an image or video first.'); return; }
    setPosting(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${me.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('stories').upload(path, file, { upsert: false });
    if (upErr) { setError(upErr.message); setPosting(false); return; }
    const { data: pub } = supabase.storage.from('stories').getPublicUrl(path);

    const { error: insErr } = await supabase.from('stories').insert({
      user_id: me.id,
      media_urls: pub.publicUrl,
      media_type: file.type.startsWith('video/') ? 'video' : 'image',
      caption: caption || null,
    });

    setPosting(false);
    if (insErr) { setError(insErr.message); return; }
    onClose();
  }

  return (
    <Modal open onClose={onClose} padding={0} width={440}>
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[17px] font-semibold m-0">New story</h3>
        <IconButton onClick={onClose}><IconX size={18} /></IconButton>
      </div>
      <div className="p-5">
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onPick} />
        {previewUrl ? (
          <div className="relative rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: '9/16', maxHeight: 500 }}>
            {file!.type.startsWith('video/')
              ? <video src={previewUrl} controls className="w-full h-full object-cover" />
              : <img src={previewUrl} alt="" className="w-full h-full object-cover" />}
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="ch-hover w-full h-[240px] rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-2)]"
            style={{ background: 'var(--bg-2)' }}>
            <IconImage size={28} />
            <div className="text-sm font-medium text-[var(--text)]">Pick an image or video</div>
            <div className="text-[11px]">Visible for 24 hours</div>
          </button>
        )}
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Add a caption..." maxLength={120}
          className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none mt-3" />
        {error && <div className="text-red-500 text-[13px] mt-2">{error}</div>}
      </div>
      <div className="px-5 py-4 border-t border-[var(--border)] flex justify-between">
        {previewUrl && <Button variant="secondary" onClick={() => { setFile(null); setPreviewUrl(null); }}>Change</Button>}
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={post} disabled={posting || !file}>{posting ? 'Posting…' : 'Share story'}</Button>
        </div>
      </div>
    </Modal>
  );
}
