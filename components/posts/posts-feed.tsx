'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@/components/icons';
import { PostCard } from '@/components/posts/post-card';
import { PostComposer } from '@/components/posts/post-composer';
import type { Post, Profile } from '@/lib/supabase/types';

type PostWithMeta = Post & {
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>;
  likes: number; liked: boolean; commentCount: number;
};

export function PostsFeed({ posts }: { posts: PostWithMeta[] }) {
  const router = useRouter();
  const [composer, setComposer] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <header className="px-6 pt-[18px] pb-3.5 flex items-center justify-between sticky top-0 z-[2]"
        style={{ background: 'color-mix(in oklab, var(--bg) 80%, transparent)', backdropFilter: 'blur(12px)' }}>
        <h2 className="text-xl font-semibold tracking-tight m-0">Feed</h2>
        <Button size="sm" icon={<IconPlus size={16} />} onClick={() => setComposer(true)}>New post</Button>
      </header>

      <div className="max-w-[600px] mx-auto px-4 pb-10 flex flex-col gap-6">
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
        {posts.length === 0 && (
          <div className="text-center text-[var(--text-2)] text-sm py-20">
            No posts yet. Be the first to share something.
          </div>
        )}
      </div>

      {composer && <PostComposer onClose={() => { setComposer(false); router.refresh(); }} />}
    </div>
  );
}
