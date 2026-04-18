import { Avatar } from '@/components/ui/avatar';
import type { User } from '@/types';

type Props = {
  user: User;
  size?: number;
  ring?: boolean;
  dot?: boolean;
};

export function UserAvatar({ user, size, ring, dot }: Props) {
  const displayName = user.display_name || user.full_name || 'User';
  return (
    <Avatar
      user={{ ...user, display_name: displayName }}
      size={size}
      ring={ring}
      dot={dot}
    />
  );
}
