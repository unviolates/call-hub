'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconImage, IconArrowLeft } from '@/components/icons';
import Link from 'next/link';

export default function NewPostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function createPost() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let mediaUrl = null;
      if (mediaFile) {
        const fileName = `${Date.now()}-${mediaFile.name}`;
        const { data, error } = await supabase.storage
          .from('posts')
          .upload(fileName, mediaFile);
        if (error) throw error;
        mediaUrl = data?.path;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption,
          media_url: mediaUrl,
          media_type: mediaFile?.type.startsWith('image') ? 'image' : 'video',
        });

      if (error) throw error;
      router.push('/posts');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
        <Link href="/posts">
          <Button size="sm" variant="secondary">
            <IconArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Post</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What&apos;s on your mind?"
          className="w-full h-24 p-4 rounded-lg border border-[var(--border)] bg-transparent text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />

        {preview && (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full rounded-lg max-h-96 object-cover" />
            <button
              onClick={() => {
                setPreview('');
                setMediaFile(null);
              }}
              className="absolute top-2 right-2 bg-black/50 text-white px-3 py-1 rounded text-sm hover:bg-black/70"
            >
              Remove
            </button>
          </div>
        )}

        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--bg-2)] transition">
          <IconImage size={20} />
          <span className="text-sm">Add Photo or Video</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        <Button
          onClick={createPost}
          disabled={loading || !caption.trim()}
          className="w-full"
        >
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}
