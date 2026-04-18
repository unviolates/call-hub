'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserAvatar } from '@/components/user-avatar';
import { IconPlus } from '@/components/icons';
import type { Story, User } from '@/types';

interface StoryWithAuthor extends Story {
  author: User;
}

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadStories();
    const channel = supabase
      .channel('stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        loadStories();
      })
      .subscribe();
    return () => {
      void channel.unsubscribe();
    };
  }, []);

  async function loadStories() {
    try {
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!storiesData) return;

      const enriched = await Promise.all(
        storiesData.map(async (story) => {
          const { data: author } = await supabase
            .from('users')
            .select('*')
            .eq('id', story.user_id)
            .single();
          return { ...story, author: author! };
        })
      );

      setStories(enriched);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h1 className="text-2xl font-bold">Stories</h1>
        <Link href="/stories/new" className="p-2 hover:bg-[var(--bg-2)] rounded-lg transition">
          <IconPlus size={20} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-2)]">
            No active stories. Create one!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className="relative group cursor-pointer rounded-lg overflow-hidden aspect-[9/16]"
              >
                <img
                  src={story.media_url}
                  alt="Story"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={story.author} size={28} />
                    <div className="text-xs font-semibold truncate">
                      {story.author.display_name || story.author.full_name}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
