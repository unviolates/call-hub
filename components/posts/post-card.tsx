'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { IconButton } from '@/components/ui/button';
import {
  IconHeart, IconHeartFill, IconMessageCircle, IconShare, IconBookmark,
  IconMoreVertical, VerifyBadge, IconSend,
} from '@/components/icons';
import { createClient } from '@/lib/supabase/client';
import { useMe } from '@/components/app-shell';
import { relativeTime } from '@/lib/utils';
import type { Post, Profile, Comment } from '@/lib/supabase/types';

type PostWithMeta = Post & {
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'verified'>;
  likes: number; liked: boolean; commentCount: number;
};

export function PostCard({ post }: { post: PostWithMeta }) {
  const me = useMe();
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<(Comment & { profiles: Pick<Profile, 'display_name' | 'avatar_url' | 'username'> })[]>([]);
  const [commentText, setCommentText] = useState('');
  const [slide, setSlide] = useState(0);
  const [saved, setSaved] = useState(false);

  async function toggleLike() {
    const supabase = createClient();
    if (liked) {
      setLiked(false); setLikes((l) => Math.max(0, l - 1));
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', me.id);
    } else {
      setLiked(true); setLikes((l) => l + 1);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: me.id });
    }
  }

  async function loadComments() {
    if (showComments) { setShowComments(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:user_id(display_name, avatar_url, username)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    setComments((data ?? []) as any);
    setShowComments(true);
  }

  async function addComment() {
    const body = commentText.trim();
    if (!body) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: me.id, body })
      .select('*, profiles:user_id(display_name, avatar_url, username)').single();
    if (data) setComments((c) => [...c, data as any]);
    setCommentText('');
  }

  const hasMedia = post.media_urls?.length > 0;

  return (
    <article className="border border-[var(--border)] rounded-2xl overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-2.5">
        <Link href={`/profile/${post.profiles.username}`}><Avatar user={post.profiles} size={36} /></Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.profiles.username}`} className="flex items-center gap-1 text-[14px] font-semibold text-[var(--text)]">
            {post.profiles.display_name}
            {post.profiles.verified && <VerifyBadge size={11} />}
          </Link>
          <div className="text-[12px] text-[var(--text-2)]">@{post.profiles.username} · {relativeTime(post.created_at)}</div>
        </div>
        <IconButton><IconMoreVertical size={18} /></IconButton>
      </header>

      {/* Media carousel */}
      {hasMedia && (
        <div className="relative bg-black">
          <div className="w-full" style={{ aspectRatio: '4/5', maxHeight: 600 }}>
            {post.media_urls[slide].endsWith('.mp4')
              ? <video src={post.media_urls[slide]} controls className="w-full h-full object-contain" />
              : <img src={post.media_urls[slide]} alt="" className="w-full h-full object-contain" />}
          </div>
          {post.media_urls.length > 1 && (
            <>
              <button onClick={() => setSlide((s) => Math.max(0, s - 1))} disabled={slide === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 text-black disabled:opacity-40 flex items-center justify-center">‹</button>
              <button onClick={() => setSlide((s) => Math.min(post.media_urls.length - 1, s + 1))} disabled={slide === post.media_urls.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 text-black disabled:opacity-40 flex items-center justify-center">›</button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {post.media_urls.map((_, i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === slide ? 'white' : 'rgba(255,255,255,0.5)' }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pt-3 flex items-center gap-3">
        <button onClick={toggleLike} className="transition-transform active:scale-90">
          {liked ? <IconHeartFill size={24} style={{ color: '#EF4444' }} /> : <IconHeart size={24} />}
        </button>
        <button onClick={loadComments}><IconMessageCircle size={24} /></button>
        <button><IconShare size={24} /></button>
        <div className="flex-1" />
        <button onClick={() => setSaved(!saved)}>
          <IconBookmark size={24} style={{ color: saved ? 'var(--accent)' : undefined, fill: saved ? 'var(--accent)' : 'none' }} />
        </button>
      </div>

      {likes > 0 && <div className="px-4 pt-1.5 text-[13.5px] font-semibold">{likes} {likes === 1 ? 'like' : 'likes'}</div>}

      {post.caption && (
        <div className="px-4 pt-1.5 text-[14px] leading-relaxed">
          <Link href={`/profile/${post.profiles.username}`} className="font-semibold text-[var(--text)] mr-1.5">{post.profiles.username}</Link>
          <span className="whitespace-pre-wrap">{post.caption}</span>
        </div>
      )}

      {post.commentCount > 0 && !showComments && (
        <button onClick={loadComments} className="px-4 pt-1.5 text-[13px] text-[var(--text-2)]">
          View all {post.commentCount} comments
        </button>
      )}

      {showComments && (
        <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-[13.5px]">
              <Link href={`/profile/${c.profiles.username}`} className="font-semibold">{c.profiles.username}</Link>
              <span className="flex-1 whitespace-pre-wrap">{c.body}</span>
            </div>
          ))}
          {comments.length === 0 && <div className="text-[13px] text-[var(--text-2)]">Be the first to comment.</div>}
        </div>
      )}

      {/* Compose comment */}
      <div className="px-4 py-3 border-t border-[var(--border)] flex items-center gap-2">
        <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addComment()}
          placeholder="Add a comment..."
          className="flex-1 bg-transparent outline-none text-sm" />
        {commentText.trim() && (
          <button onClick={addComment} className="text-[var(--accent)] text-sm font-semibold">Post</button>
        )}
      </div>
    </article>
  );
}
