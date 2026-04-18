'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Button, IconButton } from '@/components/ui/button';
import { IconPlus, IconX, VerifyBadge } from '@/components/icons';
import { StoryUploader } from '@/components/stories/story-uploader';
import { StoryViewer } from '@/components/stories/story-viewer';
import { useMe } from '@/components/app-shell';
import type { Story, Profile } from '@/lib/supabase/types';

type S = Story & { profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'> };

export function StoriesScreen({ stories }: { stories: S[] }) {
  const me = useMe();
  const router = useRouter();
  const [uploader, setUploader] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);

  // group by user
  const byUser = new Map<string, S[]>();
  for (const s of stories) {
    const arr = byUser.get(s.user_id) ?? [];
    arr.push(s);
    byUser.set(s.user_id, arr);
  }

  const entries = Array.from(byUser.entries()).map(([uid, list]) => ({
    uid, list, profile: list[0].profiles,
  }));

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <header className="px-6 pt-[18px] pb-3.5 flex items-center justify-between sticky top-0 z-[2]"
        style={{ background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(12px)' }}>
        <h2 className="text-xl font-semibold tracking-tight m-0">Stories</h2>
        <Button size="sm" icon={<IconPlus size={16} />} onClick={() => setUploader(true)}>New story</Button>
      </header>

      <div className="px-6 pb-10 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        <button onClick={() => setUploader(true)}
          className="ch-hover h-[280px] rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-2)]"
          style={{ background: 'var(--bg-2)' }}>
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white inline-flex items-center justify-center">
            <IconPlus size={20} />
          </div>
          <div className="text-[13px] font-medium text-[var(--text)]">Add your story</div>
          <div className="text-[12px]">Share a moment</div>
        </button>

        {entries.map(({ uid, list, profile }) => {
          const cover = list[0];
          return (
            <button key={uid} onClick={() => setViewer(uid)}
              className="h-[280px] rounded-2xl overflow-hidden relative border border-[var(--border)] transition-transform hover:-translate-y-0.5">
              {cover.media_url ? (
                <img src={cover.media_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: cover.tone }} />
              )}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
              <div className="absolute top-3 left-3"><Avatar user={profile} size={32} ring /></div>
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="flex items-center gap-1">
                  <div className="text-[13.5px] font-semibold">{uid === me.id ? 'You' : profile.display_name}</div>
                  {profile.verified && <VerifyBadge size={11} />}
                </div>
                <div className="text-[12px] opacity-80 line-clamp-1">{cover.caption ?? `${list.length} ${list.length === 1 ? 'story' : 'stories'}`}</div>
              </div>
            </button>
          );
        })}
      </div>

      {uploader && <StoryUploader onClose={() => { setUploader(false); router.refresh(); }} />}
      {viewer && (
        <StoryViewer
          stories={byUser.get(viewer)!}
          profile={byUser.get(viewer)![0].profiles}
          isMine={viewer === me.id}
          onClose={() => { setViewer(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
