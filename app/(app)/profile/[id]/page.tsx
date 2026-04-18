'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { IconMessageSquare, IconUserPlus, IconArrowLeft } from '@/components/icons';
import type { User, Post } from '@/lib/supabase/types';

interface UserWithStats extends User {
  postCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<UserWithStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setCurrentUserId(authUser.id);

      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!userData) return;

      const { count: postCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      const { count: followers } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact' })
        .eq('following_id', userId);

      const { count: following } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', userId);

      const { data: followData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', authUser.id)
        .eq('following_id', userId);

      setUser({
        ...userData,
        postCount: postCount || 0,
        followersCount: followers || 0,
        followingCount: following || 0,
        isFollowing: !!followData?.[0],
      });

      // Load user's posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow() {
    if (!user) return;

    try {
      if (user.isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          });
      }
      loadProfile();
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center h-full">User not found</div>;
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
        <Link href="/search">
          <Button size="sm" variant="secondary">
            <IconArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">{user.display_name}</h1>
      </div>

      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/5" />

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-16 mb-4">
          <UserAvatar user={user} size={96} />
          <div className="flex gap-2">
            <Link href={`/chats/${userId}`}>
              <Button className="flex items-center gap-2">
                <IconMessageSquare size={16} />
                Message
              </Button>
            </Link>
            {currentUserId !== userId && (
              <Button
                onClick={toggleFollow}
                variant={user.isFollowing ? 'secondary' : 'primary'}
              >
                <IconUserPlus size={16} />
                {user.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-bold">{user.display_name || user.display_name}</h1>
          <div className="text-[var(--text-2)]">@{user.username}</div>
          {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
        </div>

        <div className="flex gap-6 text-sm mb-4 text-[var(--text-2)]">
          <div>
            <div className="font-semibold text-[var(--text)]">{user.postCount}</div>
            <div className="text-xs">Posts</div>
          </div>
          <div>
            <div className="font-semibold text-[var(--text)]">{user.followersCount}</div>
            <div className="text-xs">Followers</div>
          </div>
          <div>
            <div className="font-semibold text-[var(--text)]">{user.followingCount}</div>
            <div className="text-xs">Following</div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="flex-1 border-t border-[var(--border)] overflow-y-auto">
        <div className="p-4">
          <h2 className="font-bold text-lg mb-4">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center text-[var(--text-2)] py-8">
              No posts yet
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  className="aspect-square rounded-lg overflow-hidden bg-[var(--bg-2)] hover:opacity-80 transition"
                >
                  {post.media_urls && (
                    <img
                      src={post.media_urls?.[0]}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
