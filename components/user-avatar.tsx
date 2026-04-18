import { Avatar } from '@/components/ui/avatar';
import type { Profile } from '@/lib/supabase/types';

type Props = {
  user: Profile;
  size?: number;
  ring?: boolean;
  dot?: boolean;
};

export function UserAvatar({ user, size, ring, dot }: Props) {
  return (
    <Avatar
      user={user}
      size={size}
      ring={ring}
      dot={dot}
    />
  );
}
