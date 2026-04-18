import { createClient } from '@/lib/supabase/server';
import { PostsFeed } from '@/components/posts/posts-feed';

export const dynamic = 'force-dynamic';

export default async function PostsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles:user_id(id, username, display_name, avatar_url, verified)')
    .order('created_at', { ascending: false })
    .limit(50);

  const ids = (posts ?? []).map((p: any) => p.id);
  const { data: likes } = ids.length
    ? await supabase.from('post_likes').select('post_id, user_id').in('post_id', ids)
    : { data: [] };
  const { data: comments } = ids.length
    ? await supabase.from('comments').select('post_id').in('post_id', ids)
    : { data: [] };

  const likesByPost = new Map<string, { count: number; liked: boolean }>();
  for (const id of ids) likesByPost.set(id, { count: 0, liked: false });
  for (const l of likes ?? []) {
    const rec = likesByPost.get(l.post_id)!;
    rec.count += 1;
    if (l.user_id === user?.id) rec.liked = true;
  }
  const commentCount = new Map<string, number>();
  for (const c of comments ?? []) commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1);

  const enriched = (posts ?? []).map((p: any) => ({
    ...p,
    likes: likesByPost.get(p.id)?.count ?? 0,
    liked: likesByPost.get(p.id)?.liked ?? false,
    commentCount: commentCount.get(p.id) ?? 0,
  }));

  return <PostsFeed posts={enriched as any} />;
}
