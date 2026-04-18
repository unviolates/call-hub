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
import { createGroup } from '@/app/actions/group';

export function NewGroupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);

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

  function toggleUser(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((uid) => uid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  async function handleCreateGroup() {
    if (selectedIds.length === 0 || !groupName.trim()) return;
    setBusy(true);

    const formData = new FormData();
    formData.append('name', groupName);
    formData.append('userIds', selectedIds.join(','));

    const res = await createGroup(formData);
    setBusy(false);

    if (res.error) {
      alert(res.error);
      return;
    }

    onClose();
    router.push(`/chats/${res.conversationId}`);
    router.refresh();
  }

  return (
    <Modal open={open} onClose={onClose} padding={0} width={520}>
      <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="text-[17px] font-semibold m-0">Create Group</h3>
        <IconButton onClick={onClose}><IconX size={18} /></IconButton>
      </div>

      <div className="px-6 pt-4 pb-2 flex flex-col gap-3">
        <input 
          type="text" 
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
          className="w-full p-2.5 rounded-lg border border-[var(--border)] bg-transparent input-ring outline-none" 
        />
        <SearchBar value={query} onChange={setQuery} placeholder="Search members" />
      </div>

      <div className="px-3 pb-3 max-h-60 overflow-y-auto">
        {users.map((u) => (
          <button key={u.id} onClick={() => toggleUser(u.id)}
            className="ch-hover w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-[10px] text-left">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar user={u} size={36} dot={u.online} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{u.display_name}</span>
                  {u.verified && <VerifyBadge size={11} />}
                </div>
                <div className="text-xs text-[var(--text-2)]">@{u.username}</div>
              </div>
            </div>
            <div className="flex-shrink-0 h-5 w-5 rounded-full border border-blue-500 flex items-center justify-center">
              {selectedIds.includes(u.id) && <div className="h-3 w-3 bg-blue-500 rounded-full" />}
            </div>
          </button>
        ))}
        {users.length === 0 && <div className="text-center text-[var(--text-2)] text-sm p-6">No people found.</div>}
      </div>
      
      <div className="px-6 py-3 border-t border-[var(--border)] flex justify-end">
        <Button onClick={handleCreateGroup} disabled={busy || selectedIds.length === 0 || !groupName.trim()}>
          {busy ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </Modal>
  );
}