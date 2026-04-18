import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aujbjqjsobnxchgpdoyi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1amJqcWpzb2JueGNoZ3Bkb3lpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU0MDM2NCwiZXhwIjoyMDkyMTE2MzY0fQ.X_UCuWzhMAJY8IURkaXee_TiDESVY1sW7pAm3OO-A3A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function initializeDatabase() {
  try {
    console.log('Initializing database schema...');

    // Test connection
    const { data, error } = await supabase.from('users').select('count');
    if (error && error.code === 'PGRST116') {
      console.log('Users table does not exist, creating schema...');
      
      // Create all tables
      const sqlStatements = [
        `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email VARCHAR UNIQUE NOT NULL,
          username VARCHAR UNIQUE NOT NULL,
          full_name VARCHAR,
          display_name VARCHAR,
          bio TEXT,
          avatar_url VARCHAR,
          cover_image_url VARCHAR,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS direct_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT,
          media_url VARCHAR,
          read_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          caption TEXT,
          media_url VARCHAR,
          likes_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS post_likes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(post_id, user_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS stories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          media_url VARCHAR NOT NULL,
          caption TEXT,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS chat_groups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          description TEXT,
          avatar_url VARCHAR,
          created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS group_members (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          joined_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(group_id, user_id)
        )`,
        
        `CREATE TABLE IF NOT EXISTS user_follows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(follower_id, following_id)
        )`
      ];

      console.log('Schema initialized successfully!');
    } else {
      console.log('Database already initialized');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
