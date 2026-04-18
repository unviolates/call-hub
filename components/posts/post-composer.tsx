'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/modal';
import { Button, IconButton } from '@/components/ui/button';
import { IconX, IconImage, IconTrash } from '@/components/icons';
import { useMe } from '@/components/app-shell';

export function PostComposer({ onClose }: { onClose: () => void }) {
  const me = useMe();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files || []).slice(0, 10 - files.length);
    const urls = fs.map((f) => URL.createObjectURL(f));
    setFiles((x) => [...x, ...fs]);
    setPreviews((x) => [...x, ...urls]);
  }

  function removeAt(idx: number) {
    setFiles((x) => x.filter((_, i) => i !== idx));
    setPreviews((x) => x.filter((_, i) => i !== idx));
  }

  async function post() {
    setPosting(true);
    setError(null);
    const supabase = createClient();

    const urls: string[] = [];
    for (const f of files) {
      const ext = f.name.split('.').pop() || 'jpg';
      const path = `${me.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('posts').upload(path, f);
      if (upErr) { setError(upErr.message); setPosting(false); return; }
      const { data: pub } = supabase.storage.from('posts').getPublicUrl(path);
      urls.push(pub.publicUrl);
    }

    const { error } = await supabase.from('posts').insert({
      user_id: me.id, caption: caption || null,
      media_urlss: urls,
      media_type: files[0]?.type.startsWith('video/') ? 'video' : 'image',
      location: location || null,
    });
    setPosting(false);
    if (error) { setError(error.message); return; }
    onClose();
  }

  return (
    <Modal open onClose={onClose} padding={0} width={560}>
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[17px] font-semibold m-0">New post</h3>
        <IconButton onClick={onClose}><IconX size={18} /></IconButton>
      </div>
      <div className="p-5 flex flex-col gap-3">
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={onPick} />
        {previews.length === 0 ? (
          <button onClick={() => fileRef.current?.click()}
            className="ch-hover w-full h-[220px] rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-2)]"
            style={{ background: 'var(--bg-2)' }}>
            <IconImage size={28} />
            <div className="text-sm font-medium text-[var(--text)]">Add photos or video</div>
            <div className="text-[11px]">Up to 10 photos per post</div>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                {files[i].type.startsWith('video/')
                  ? <video src={url} className="w-full h-full object-cover" />
                  : <img src={url} alt="" className="w-full h-full object-cover" />}
                <button onClick={() => removeAt(i)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white inline-flex items-center justify-center">
                  <IconTrash size={13} />
                </button>
              </div>
            ))}
            {previews.length < 10 && (
              <button onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-2)]"
                style={{ background: 'var(--bg-2)' }}>
                <IconImage size={20} />
              </button>
            )}
          </div>
        )}
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..."
          rows={4}
          className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm outline-none resize-y" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location (optional)"
          className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none" />
        {error && <div className="text-red-500 text-[13px]">{error}</div>}
      </div>
      <div className="px-5 py-4 border-t border-[var(--border)] flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={post} disabled={posting || previews.length === 0}>{posting ? 'Posting…' : 'Share post'}</Button>
      </div>
    </Modal>
  );
}
