'use client';

import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { IconArrowLeft, IconX, VerifyBadge, IconHeart, IconSend } from '@/components/icons';
import { createClient } from '@/lib/supabase/client';
import { useMe } from '@/components/app-shell';
import type { Story, Profile } from '@/lib/supabase/types';
import { relativeTime } from '@/lib/utils';

export function StoryViewer({
  stories, profile, isMine, onClose,
}: {
  stories: Story[];
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>;
  isMine: boolean;
  onClose: () => void;
}) {
  const me = useMe();
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number | null>(null);
  const cur = stories[index];

  useEffect(() => {
    startRef.current = Date.now();
    setProgress(0);
    const tick = () => {
      const p = Math.min(1, (Date.now() - startRef.current) / 6000);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else next();
    };
    rafRef.current = requestAnimationFrame(tick);

    (async () => {
      const supabase = createClient();
      await supabase.from('story_views').upsert({ story_id: cur.id, viewer_id: me.id });
      if (isMine) {
        const { count } = await supabase.from('story_views').select('*', { count: 'exact', head: true }).eq('story_id', cur.id);
        setViewCount(count ?? 0);
      }
    })();

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cur.id]);

  function next() {
    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  }
  function prev() {
    if (index > 0) setIndex(index - 1);
  }

  async function sendReply() {
    if (!reply.trim()) return;
    const supabase = createClient();
    const { data: convId } = await supabase.rpc('get_or_create_dm', { other_user: profile.id });
    if (convId) {
      await supabase.from('messages').insert({
        conversation_id: convId as string, sender_id: me.id,
        body: `Replied to your story: ${reply}`,
      });
    }
    setReply('');
  }

  return (
    <div onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(28px) saturate(140%)' }}>
      <div onClick={(e) => e.stopPropagation()}
        className="relative rounded-[20px] overflow-hidden shadow-2xl animate-fade-scale-in"
        style={{ width: 380, maxWidth: 'calc(100vw - 32px)', height: 'min(700px, calc(100vh - 48px))' }}>

        {/* Media */}
        {cur.media_url && (cur.media_type === 'video'
          ? <video key={cur.id} src={cur.media_url} autoPlay muted playsInline className="w-full h-full object-cover" />
          : <img src={cur.media_url} alt="" className="w-full h-full object-cover" />
        )}

        {/* Tap zones */}
        <button onClick={prev} className="absolute left-0 top-0 bottom-0 w-1/3" aria-label="Previous" />
        <button onClick={next} className="absolute right-0 top-0 bottom-0 w-1/3" aria-label="Next" />

        {/* Progress bars */}
        <div className="absolute top-3 left-4 right-4 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-4 right-4 flex items-center gap-2.5 text-white">
          <Avatar user={profile} size={32} />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">{profile.display_name}</span>
              {profile.verified && <VerifyBadge size={11} />}
            </div>
            <div className="text-[12px] opacity-80">{relativeTime(cur.created_at)}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/35 text-white inline-flex items-center justify-center">
            <IconX size={16} />
          </button>
        </div>

        {/* Caption */}
        {cur.caption && (
          <div className="absolute top-16 left-4 right-4 text-center text-white text-sm bg-black/25 px-3 py-1.5 rounded-full">
            {cur.caption}
          </div>
        )}

        {/* Bottom */}
        <div className="absolute bottom-5 left-4 right-4 flex items-center gap-2">
          {isMine ? (
            <div className="text-white text-[13px] bg-black/40 px-3 py-1.5 rounded-full">
              {viewCount} {viewCount === 1 ? 'view' : 'views'}
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center bg-white/15 border border-white/25 rounded-full px-4 backdrop-blur">
                <input value={reply} onChange={(e) => setReply(e.target.value)}
                  placeholder={`Reply to ${profile.display_name.split(' ')[0]}…`}
                  onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                  className="flex-1 bg-transparent outline-none text-white text-sm py-2 placeholder-white/60" />
              </div>
              <button className="w-10 h-10 rounded-full bg-white/15 border border-white/25 text-white inline-flex items-center justify-center">
                <IconHeart size={18} />
              </button>
              {reply.trim() && (
                <button onClick={sendReply} className="w-10 h-10 rounded-full bg-[var(--accent)] text-white inline-flex items-center justify-center">
                  <IconSend size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
