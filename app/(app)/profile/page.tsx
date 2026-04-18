'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconLogout, IconMapPin } from '@/components/icons';
import type { User } from '@/lib/supabase/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      setCurrentUserId(authUser.id);

      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);
        setFullName(userData.display_name || '');
        setBio(userData.bio || '');
        setUsername(userData.username);

        // Load stats
        const { count: posts } = await supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('user_id', authUser.id);

        const { count: followers } = await supabase
          .from('user_follows')
          .select('id', { count: 'exact' })
          .eq('following_id', authUser.id);

        const { count: following } = await supabase
          .from('user_follows')
          .select('id', { count: 'exact' })
          .eq('follower_id', authUser.id);

        setPostCount(posts || 0);
        setFollowersCount(followers || 0);
        setFollowingCount(following || 0);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!user) return;
    try {
      setSaving(true);
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio: bio,
          username: username,
        })
        .eq('id', user.id);

      setIsEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
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
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-[var(--accent)]/20 to-[var(--accent)]/5" />

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-16 mb-4">
          <UserAvatar user={user} size={96} />
          <Button
            onClick={signOut}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <IconLogout size={16} />
            Sign Out
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
            />
            <div className="flex gap-2">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold">{user.display_name || user.display_name}</h1>
              <div className="text-[var(--text-2)]">@{user.username}</div>
              {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
            </div>

            <div className="flex gap-6 text-sm mb-4 text-[var(--text-2)]">
              <div>
                <div className="font-semibold text-[var(--text)]">{postCount}</div>
                <div className="text-xs">Posts</div>
              </div>
              <div>
                <div className="font-semibold text-[var(--text)]">{followersCount}</div>
                <div className="text-xs">Followers</div>
              </div>
              <div>
                <div className="font-semibold text-[var(--text)]">{followingCount}</div>
                <div className="text-xs">Following</div>
              </div>
            </div>

            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </>
        )}
      </div>

      {/* Posts Grid */}
      <div className="flex-1 border-t border-[var(--border)] overflow-y-auto">
        <div className="p-4">
          <h2 className="font-bold text-lg mb-4">Posts</h2>
          <div className="grid grid-cols-3 gap-2">
            {/* User's posts will be displayed here */}
          </div>
        </div>
      </div>
    </div>
  );
}
