'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { IconHeart, IconMessageCircle, IconShare, IconPlus } from '@/components/icons';
import Link from 'next/link';
import type { Post, User } from '@/types';

interface PostWithAuthor extends Post {
  author: User;
  liked: boolean;
  commentCount: number;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    loadPosts();
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadPosts();
      })
      .subscribe();
    return () => {
      void channel.unsubscribe();
    };
  }, []);

  async function loadPosts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!postsData) return;

      const enriched = await Promise.all(
        postsData.map(async (post) => {
          const { data: author } = await supabase
            .from('users')
            .select('*')
            .eq('id', post.user_id)
            .single();

          const { data: likes } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id);

          const { data: likes_user } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id);

          const { data: comments } = await supabase
            .from('comments')
            .select('id')
            .eq('post_id', post.id);

          return {
            ...post,
            author: author!,
            liked: !!likes_user?.[0],
            commentCount: comments?.length || 0,
          };
        })
      );

      setPosts(enriched);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(postId: string, liked: boolean) {
    try {
      if (liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUserId);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: currentUserId });
      }
      loadPosts();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold">Feed</h1>
        <Link href="/posts/new" className="p-2 hover:bg-[var(--bg-2)] rounded-lg transition">
          <IconPlus size={20} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
        {loading ? (
          <div className="flex items-center justify-center h-32">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-2)]">
            No posts yet. Create one!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 hover:bg-[var(--bg-2)] transition-colors">
              <Link href={`/posts/${post.id}`} className="flex gap-3 mb-3">
                <UserAvatar user={post.author} size={40} />
                <div>
                  <div className="font-semibold text-sm">{post.author.display_name || post.author.full_name}</div>
                  <div className="text-xs text-[var(--text-2)]">@{post.author.username}</div>
                </div>
              </Link>

              {post.caption && <p className="text-sm mb-3">{post.caption}</p>}

              {post.media_url && (
                <img
                  src={post.media_url}
                  alt="Post media"
                  className="w-full rounded-lg mb-3 max-h-96 object-cover"
                />
              )}

              <div className="flex gap-8 text-[var(--text-2)] text-sm">
                <button
                  onClick={() => toggleLike(post.id, post.liked)}
                  className="flex items-center gap-2 hover:text-[var(--accent)] transition"
                >
                  <IconHeart
                    size={16}
                    fill={post.liked ? 'currentColor' : 'none'}
                    color={post.liked ? 'var(--accent)' : 'currentColor'}
                  />
                  {post.likes_count}
                </button>
                <button className="flex items-center gap-2 hover:text-[var(--accent)] transition">
                  <IconMessageCircle size={16} />
                  {post.commentCount}
                </button>
                <button className="flex items-center gap-2 hover:text-[var(--accent)] transition">
                  <IconShare size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
