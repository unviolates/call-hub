import { createClient } from '@/lib/supabase/server';
import { ChatList } from '@/components/chat/chat-list';
import { EmptyConversation } from '@/components/chat/empty-conversation';

export const dynamic = 'force-dynamic';

export default async function ChatsPage() {
  const supabase = createClient();
  const chats = await fetchChats(supabase);

  return (
    <>
      <ChatList chats={chats} activeId={null} />
      <div className="hidden lg:flex flex-1"><EmptyConversation /></div>
    </>
  );
}

async function fetchChats(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id, pinned, last_read_at, conversations(*)')
    .eq('user_id', user.id);

  if (!memberships) return [];

  const conversationIds = memberships.map((m) => m.conversation_id);
  if (!conversationIds.length) return [];

  const { data: allMembers } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, profiles(id, username, display_name, avatar_url, verified, online)')
    .in('conversation_id', conversationIds);

  const { data: latestMessages } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })
    .limit(200);

  return memberships.map((m: any) => {
    const conv = m.conversations;
    const members = (allMembers || []).filter((x: any) => x.conversation_id === m.conversation_id);
    const other = conv?.is_group ? null : members.find((x: any) => x.user_id !== user.id);
    const lastMsg = (latestMessages || []).find((x: any) => x.conversation_id === m.conversation_id);
    const unread = (latestMessages || []).filter((x: any) =>
      x.conversation_id === m.conversation_id &&
      x.sender_id !== user.id &&
      new Date(x.created_at) > new Date(m.last_read_at)
    ).length;

    return {
      id: conv.id,
      isGroup: conv.is_group,
      name: conv.is_group ? conv.name : (other as any)?.profiles?.display_name ?? 'Unknown',
      username: conv.is_group ? null : (other as any)?.profiles?.username ?? null,
      avatarUrl: conv.is_group ? conv.avatar_url : (other as any)?.profiles?.avatar_url ?? null,
      online: !conv.is_group && ((other as any)?.profiles?.online ?? false),
      verified: conv.is_group ? true : ((other as any)?.profiles?.verified ?? false),
      otherUserId: !conv.is_group ? (other as any)?.user_id : null,
      pinned: m.pinned,
      lastMessageAt: conv.last_message_at,
      lastMessage: lastMsg?.body ?? '',
      lastMessageFromMe: lastMsg?.sender_id === user.id,
      unread,
      membersCount: members.length,
    };
  }).sort((a: any, b: any) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });
}
