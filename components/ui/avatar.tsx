import { avatarColor, initials } from '@/lib/utils';
import type { Profile } from '@/lib/supabase/types';

type Props = {
  user: Pick<Profile, 'display_name' | 'avatar_url'> & { id?: string };
  size?: number;
  ring?: boolean;
  dot?: boolean;
};

export function Avatar({ user, size = 40, ring = false, dot = false }: Props) {
  if (!user) return null;
  const [bg, fg] = avatarColor(user.display_name || 'User');
  const init = initials(user.display_name || '?');

  const inner = user.avatar_url ? (
    <img
      src={user.avatar_url}
      alt=""
      style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size, height: size, borderRadius: 999,
        background: bg, color: fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600, fontSize: size * 0.38, letterSpacing: '-0.01em', flexShrink: 0,
      }}
    >{init}</div>
  );

  const dotEl = dot ? (
    <div style={{
      position: 'absolute', right: 0, bottom: 0,
      width: Math.max(8, Math.round(size * 0.26)),
      height: Math.max(8, Math.round(size * 0.26)),
      borderRadius: 999, background: '#10B981',
      boxShadow: '0 0 0 2px var(--bg)',
    }} />
  ) : null;

  if (ring) {
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <div className="story-ring" style={{ width: size, height: size }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 999, padding: 2, background: 'var(--bg)' }}>
            <div style={{ width: '100%', height: '100%' }}>{inner}</div>
          </div>
        </div>
        {dotEl}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {inner}
      {dotEl}
    </div>
  );
}
