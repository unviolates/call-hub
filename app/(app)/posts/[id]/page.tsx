'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconHeart, IconMessageCircle, IconArrowLeft } from '@/components/icons';
import type { Post, User, Comment } from '@/types';

interface PostWithAuthor extends Post {
  author: User;
  liked: boolean;
}

export default function PostPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<(Comment & { author: User })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [posting, setPosting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function loadPost() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: postData } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (!postData) return;

      const { data: author } = await supabase
        .from('users')
        .select('*')
        .eq('id', postData.user_id)
        .single();

      const { data: likes } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setPost({
        ...postData,
        author: author!,
        liked: !!likes?.[0],
      });

      // Load comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (commentsData) {
        const enrichedComments = await Promise.all(
          commentsData.map(async (comment) => {
            const { data: commentAuthor } = await supabase
              .from('users')
              .select('*')
              .eq('id', comment.user_id)
              .single();
            return { ...comment, author: commentAuthor! };
          })
        );
        setComments(enrichedComments);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addComment() {
    if (!newComment.trim() || !post) return;

    try {
      setPosting(true);
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment,
        });

      if (error) throw error;
      setNewComment('');
      loadPost();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike() {
    if (!post) return;
    try {
      if (post.liked) {
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
      loadPost();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!post) {
    return <div className="flex items-center justify-center h-full">Post not found</div>;
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
        <Link href="/posts">
          <Button size="sm" variant="secondary">
            <IconArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">Post</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <Link href={`/profile/${post.author.id}`} className="flex gap-3 mb-4">
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
              alt="Post"
              className="w-full rounded-lg mb-3 max-h-96 object-cover"
            />
          )}

          <div className="flex gap-4 text-[var(--text-2)] text-sm">
            <button
              onClick={toggleLike}
              className="flex items-center gap-2 hover:text-[var(--accent)] transition"
            >
              <IconHeart
                size={16}
                fill={post.liked ? 'currentColor' : 'none'}
                color={post.liked ? 'var(--accent)' : 'currentColor'}
              />
              {post.likes_count}
            </button>
            <div className="flex items-center gap-2">
              <IconMessageCircle size={16} />
              {comments.length}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <UserAvatar user={comment.author} size={32} />
              <div className="flex-1 bg-[var(--bg-2)] p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-semibold text-sm">{comment.author.display_name || comment.author.full_name}</div>
                  <div className="text-xs text-[var(--text-2)]">@{comment.author.username}</div>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border)] flex gap-2">
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addComment()}
        />
        <Button onClick={addComment} disabled={!newComment.trim() || posting}>
          Post
        </Button>
      </div>
    </div>
  );
}
