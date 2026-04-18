// Minimal types; regenerate with `supabase gen types typescript` after deployment.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string | null;
          cover_url: string | null;
          verified: boolean;
          online: boolean;
          last_seen: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; username: string; display_name: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      conversations: {
        Row: {
          id: string;
          is_group: boolean;
          name: string | null;
          avatar_url: string | null;
          created_by: string | null;
          last_message_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['conversations']['Row']>;
        Update: Partial<Database['public']['Tables']['conversations']['Row']>;
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          role: 'admin' | 'member';
          pinned: boolean;
          muted: boolean;
          last_read_at: string;
          joined_at: string;
        };
        Insert: Partial<Database['public']['Tables']['conversation_members']['Row']> & { conversation_id: string; user_id: string };
        Update: Partial<Database['public']['Tables']['conversation_members']['Row']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string | null;
          attachment_url: string | null;
          attachment_type: string | null;
          reply_to: string | null;
          edited: boolean;
          deleted: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['messages']['Row']> & { conversation_id: string; sender_id: string };
        Update: Partial<Database['public']['Tables']['messages']['Row']>;
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          text: string | null;
          song_title: string | null;
          song_artist: string | null;
          song_url: string | null;
          bg_color: string;
          text_color: string;
          emoji: string | null;
          kind: 'text' | 'music';
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notes']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['notes']['Row']>;
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: 'image' | 'video';
          caption: string | null;
          tone: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['stories']['Row']> & { user_id: string; media_url: string };
        Update: Partial<Database['public']['Tables']['stories']['Row']>;
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          caption: string | null;
          media_urls: string[];
          media_type: string;
          location: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['posts']['Row']> & { user_id: string };
        Update: Partial<Database['public']['Tables']['posts']['Row']>;
      };
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string };
        Update: never;
      };
      comments: {
        Row: { id: string; post_id: string; user_id: string; body: string; parent_id: string | null; created_at: string };
        Insert: { post_id: string; user_id: string; body: string; parent_id?: string | null };
        Update: Partial<{ body: string }>;
      };
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string };
        Insert: { follower_id: string; following_id: string };
        Update: never;
      };
      notifications: {
        Row: {
          id: string; user_id: string; actor_id: string | null;
          kind: string; target_id: string | null; payload: Record<string, unknown>;
          read: boolean; created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']> & { user_id: string; kind: string };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      note_reactions: {
        Row: { note_id: string; user_id: string; emoji: string; created_at: string };
        Insert: { note_id: string; user_id: string; emoji: string };
        Update: never;
      };
      note_replies: {
        Row: { id: string; note_id: string; sender_id: string; body: string; created_at: string };
        Insert: { note_id: string; sender_id: string; body: string };
        Update: Partial<{ body: string }>;
      };
      story_views: {
        Row: { story_id: string; viewer_id: string; viewed_at: string };
        Insert: { story_id: string; viewer_id: string };
        Update: never;
      };
    };
    Functions: {
      get_or_create_dm: { Args: { other_user: string }; Returns: string };
    };
  };
};

export type Profile = {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = Database['public']['Tables']['messages']['Row'];
export type Note = Database['public']['Tables']['notes']['Row'];
export type Story = Database['public']['Tables']['stories']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
