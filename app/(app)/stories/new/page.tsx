'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { IconImage, IconArrowLeft } from '@/components/icons';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function NewStoryPage() {
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

  async function createStory() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mediaFile) return;

      const fileName = `${Date.now()}-${mediaFile.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, mediaFile);

      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          caption,
          media_url: data?.path,
          media_type: mediaFile.type.startsWith('image') ? 'image' : 'video',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;
      router.push('/stories');
    } catch (error) {
      console.error('Failed to create story:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 p-4 border-b border-[var(--border)]">
        <Link href="/stories">
          <Button size="sm" variant="secondary">
            <IconArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Story</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {preview && (
          <div className="relative aspect-[9/16] rounded-lg overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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

        <label className="flex items-center justify-center gap-2 p-8 border-2 border-dashed border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--bg-2)] transition">
          <IconImage size={32} />
          <span>Click to add photo/video</span>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption (optional)"
        />

        <Button
          onClick={createStory}
          disabled={loading || !mediaFile}
          className="w-full"
        >
          {loading ? 'Posting...' : 'Share Story'}
        </Button>
      </div>
    </div>
  );
}
