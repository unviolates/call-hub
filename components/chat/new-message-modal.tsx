'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { SearchBar } from '@/components/ui/input';
import { Button, IconButton } from '@/components/ui/button';
import { IconX, VerifyBadge } from '@/components/icons';
import type { Profile } from '@/lib/supabase/types';

export function NewMessageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    (async () => {
      let q = supabase.from('profiles').select('*').limit(30);
      if (query.trim()) q = q.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
      const { data } = await q;
      setUsers((data ?? []).filter((u: any) => u.id));
    })();
  }, [open, query]);

  async function startChat(otherId: string) {
    setBusy(otherId);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_or_create_dm', { other_user: otherId });
    setBusy(null);
    if (error || !data) { alert(error?.message ?? 'Failed to start chat'); return; }
    onClose();
    router.push(`/chats/${data}`);
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} padding={0} width={520}>
      <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[17px] font-semibold m-0">New message</h3>
        <IconButton onClick={onClose}><IconX size={18} /></IconButton>
      </div>
      <div className="px-6 pt-4 pb-2">
        <SearchBar value={query} onChange={setQuery} placeholder="Search people" />
      </div>
      <div className="px-3 pb-3 max-h-80 overflow-y-auto">
        {users.map((u) => (
          <button key={u.id} onClick={() => startChat(u.id)} disabled={busy === u.id}
            className="ch-hover w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left disabled:opacity-50">
            <Avatar user={u} size={36} dot={u.online} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">{u.display_name}</span>
                {u.verified && <VerifyBadge size={11} />}
              </div>
              <div className="text-xs text-[var(--text-2)]">@{u.username}</div>
            </div>
          </button>
        ))}
        {users.length === 0 && <div className="text-center text-[var(--text-2)] text-sm p-6">No people found.</div>}
      </div>
    </Modal>
  );
}
