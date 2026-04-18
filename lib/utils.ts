import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict, isToday, isYesterday, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const avatarPairs: Array<[string, string]> = [
  ['#FDE68A', '#F59E0B'], ['#BFDBFE', '#2563EB'], ['#FBCFE8', '#DB2777'],
  ['#BBF7D0', '#059669'], ['#DDD6FE', '#7C3AED'], ['#FED7AA', '#EA580C'],
  ['#C7D2FE', '#4F46E5'], ['#A7F3D0', '#0D9488'], ['#FECACA', '#DC2626'],
];

export function avatarColor(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return avatarPairs[h % avatarPairs.length];
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function relativeTime(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  if (diff < 7 * 86_400_000) return format(d, 'EEE');
  return format(d, 'MMM d');
}

export function messageTime(iso: string) {
  return format(new Date(iso), 'h:mm a');
}

export function fullDate(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}
