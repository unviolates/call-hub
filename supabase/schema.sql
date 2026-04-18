-- ============================================================================
-- Callhub — Complete Supabase schema
-- Run this entire file in the Supabase SQL Editor once, then enable Realtime
-- on messages, notes, stories, posts, post_likes, comments, story_views, notifications.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ─── PROFILES ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null,
  display_name text not null,
  bio text default '',
  avatar_url text,
  cover_url text,
  verified boolean default false,
  online boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- ─── FOLLOWS ────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ─── CONVERSATIONS & MEMBERS ────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean default false,
  name text,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  pinned boolean default false,
  muted boolean default false,
  last_read_at timestamptz default now(),
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_members_user_idx on public.conversation_members (user_id);

-- ─── MESSAGES ───────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachment_url text,
  attachment_type text,
  reply_to uuid references public.messages(id) on delete set null,
  edited boolean default false,
  deleted boolean default false,
  created_at timestamptz default now()
);

create index if not exists messages_conv_created_idx on public.messages (conversation_id, created_at desc);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  primary key (message_id, user_id, emoji)
);

-- Track typing indicator (client clears)
create table if not exists public.typing (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  updated_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- ─── NOTES (Instagram-style) ────────────────────────────────────────────────
-- 24h expiry, short text OR song, background color, emoji accent
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text,
  song_title text,
  song_artist text,
  song_url text,
  bg_color text default '#2563EB',
  text_color text default '#FFFFFF',
  emoji text,
  kind text default 'text' check (kind in ('text', 'music')),
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

create index if not exists notes_user_idx on public.notes (user_id);
create index if not exists notes_expires_idx on public.notes (expires_at);

create table if not exists public.note_reactions (
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  primary key (note_id, user_id)
);

create table if not exists public.note_replies (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- ─── STORIES ────────────────────────────────────────────────────────────────
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  media_type text default 'image' check (media_type in ('image', 'video')),
  caption text,
  tone text default '#1e3a8a',
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

create index if not exists stories_user_idx on public.stories (user_id);
create index if not exists stories_expires_idx on public.stories (expires_at);

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz default now(),
  primary key (story_id, viewer_id)
);

-- ─── POSTS ──────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  media_urls text[] default '{}',
  media_type text default 'image',
  location text,
  created_at timestamptz default now()
);

create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists comments_post_idx on public.comments (post_id);

-- ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in (
    'message', 'follow', 'post_like', 'post_comment', 'story_view', 'note_reply', 'note_reaction'
  )),
  target_id uuid,
  payload jsonb default '{}',
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check whether the current user is a member of a conversation
create or replace function public.is_conv_member(conv_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv_id and user_id = auth.uid()
  );
$$;

-- On new auth user, create a profile row with a unique username
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));
  if length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 6);
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name, bio)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', initcap(base_username)),
    coalesce(new.raw_user_meta_data->>'bio', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bump conversation.last_message_at on new messages
create or replace function public.bump_conversation_timestamp()
returns trigger language plpgsql as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists bump_conv_ts on public.messages;
create trigger bump_conv_ts
  after insert on public.messages
  for each row execute function public.bump_conversation_timestamp();

-- Create/get a 1:1 conversation between two users
create or replace function public.get_or_create_dm(other_user uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  cid uuid;
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if me = other_user then raise exception 'cannot dm self'; end if;

  select c.id into cid
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = me
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = other_user
  where c.is_group = false
  limit 1;

  if cid is not null then return cid; end if;

  insert into public.conversations (is_group, created_by) values (false, me) returning id into cid;
  insert into public.conversation_members (conversation_id, user_id) values (cid, me), (cid, other_user);
  return cid;
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.typing enable row level security;
alter table public.notes enable row level security;
alter table public.note_reactions enable row level security;
alter table public.note_replies enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

-- PROFILES — readable by everyone, writable only by self
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (auth.uid() = id);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);

-- FOLLOWS — you manage your own follows, everyone can read
drop policy if exists follows_select on public.follows;
create policy follows_select on public.follows for select using (true);
drop policy if exists follows_write on public.follows;
create policy follows_write on public.follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- CONVERSATIONS — visible to members; members can update group metadata
drop policy if exists conv_select on public.conversations;
create policy conv_select on public.conversations for select using (public.is_conv_member(id));
drop policy if exists conv_insert on public.conversations;
create policy conv_insert on public.conversations for insert with check (auth.uid() = created_by);
drop policy if exists conv_update on public.conversations;
create policy conv_update on public.conversations for update using (public.is_conv_member(id));

-- CONVERSATION MEMBERS — visible to members; self can update own row
drop policy if exists cm_select on public.conversation_members;
create policy cm_select on public.conversation_members for select
  using (user_id = auth.uid() or public.is_conv_member(conversation_id));
drop policy if exists cm_insert on public.conversation_members;
create policy cm_insert on public.conversation_members for insert
  with check (
    user_id = auth.uid()
    or public.is_conv_member(conversation_id)
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
  );
drop policy if exists cm_update on public.conversation_members;
create policy cm_update on public.conversation_members for update using (user_id = auth.uid());
drop policy if exists cm_delete on public.conversation_members;
create policy cm_delete on public.conversation_members for delete
  using (user_id = auth.uid() or exists (
    select 1 from public.conversation_members x
    where x.conversation_id = conversation_members.conversation_id
      and x.user_id = auth.uid() and x.role = 'admin'
  ));

-- MESSAGES — only conversation members can read/write
drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages for select using (public.is_conv_member(conversation_id));
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert
  with check (auth.uid() = sender_id and public.is_conv_member(conversation_id));
drop policy if exists msg_update on public.messages;
create policy msg_update on public.messages for update using (auth.uid() = sender_id);
drop policy if exists msg_delete on public.messages;
create policy msg_delete on public.messages for delete using (auth.uid() = sender_id);

drop policy if exists mr_all on public.message_reactions;
create policy mr_all on public.message_reactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists mr_select on public.message_reactions;
create policy mr_select on public.message_reactions for select
  using (exists (select 1 from public.messages m where m.id = message_id and public.is_conv_member(m.conversation_id)));

drop policy if exists typing_rw on public.typing;
create policy typing_rw on public.typing for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists typing_select on public.typing;
create policy typing_select on public.typing for select using (public.is_conv_member(conversation_id));

-- NOTES — public read (like Instagram notes visible to followers/everyone), write self
drop policy if exists notes_select on public.notes;
create policy notes_select on public.notes for select using (expires_at > now());
drop policy if exists notes_write on public.notes;
create policy notes_write on public.notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nr_all on public.note_reactions;
create policy nr_all on public.note_reactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists nr_select on public.note_reactions;
create policy nr_select on public.note_reactions for select using (true);

drop policy if exists nrp_select on public.note_replies;
create policy nrp_select on public.note_replies for select
  using (auth.uid() = sender_id or exists (select 1 from public.notes n where n.id = note_id and n.user_id = auth.uid()));
drop policy if exists nrp_insert on public.note_replies;
create policy nrp_insert on public.note_replies for insert with check (auth.uid() = sender_id);

-- STORIES — public read while not expired, write self
drop policy if exists stories_select on public.stories;
create policy stories_select on public.stories for select using (expires_at > now());
drop policy if exists stories_write on public.stories;
create policy stories_write on public.stories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists sv_select on public.story_views;
create policy sv_select on public.story_views for select
  using (viewer_id = auth.uid() or exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid()));
drop policy if exists sv_insert on public.story_views;
create policy sv_insert on public.story_views for insert with check (auth.uid() = viewer_id);

-- POSTS — public read, write self
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select using (true);
drop policy if exists posts_write on public.posts;
create policy posts_write on public.posts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists pl_all on public.post_likes;
create policy pl_all on public.post_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists pl_select on public.post_likes;
create policy pl_select on public.post_likes for select using (true);

drop policy if exists comm_select on public.comments;
create policy comm_select on public.comments for select using (true);
drop policy if exists comm_insert on public.comments;
create policy comm_insert on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists comm_delete on public.comments;
create policy comm_delete on public.comments for delete using (auth.uid() = user_id);

-- NOTIFICATIONS — user reads own
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update using (user_id = auth.uid());
drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications for insert with check (true);

-- ============================================================================
-- STORAGE BUCKETS — run after schema
-- ============================================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('posts', 'posts', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('stories', 'stories', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict (id) do nothing;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects for select using (bucket_id in ('avatars','posts','stories'));
drop policy if exists "User upload own folder" on storage.objects;
create policy "User upload own folder" on storage.objects for insert
  with check (bucket_id in ('avatars','posts','stories','attachments') and (auth.uid()::text = (storage.foldername(name))[1]));
drop policy if exists "User update own" on storage.objects;
create policy "User update own" on storage.objects for update
  using (bucket_id in ('avatars','posts','stories','attachments') and (auth.uid()::text = (storage.foldername(name))[1]));
drop policy if exists "User delete own" on storage.objects;
create policy "User delete own" on storage.objects for delete
  using (bucket_id in ('avatars','posts','stories','attachments') and (auth.uid()::text = (storage.foldername(name))[1]));
drop policy if exists "Conv members read attachments" on storage.objects;
create policy "Conv members read attachments" on storage.objects for select
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- ============================================================================
-- REALTIME PUBLICATION — enable on key tables
-- ============================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.typing;
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.stories;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.notifications;
