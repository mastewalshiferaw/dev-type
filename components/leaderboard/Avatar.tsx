import { avatarColor, initials } from '@/lib/avatar';

export default function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-avatar-ink ${avatarColor(name)} ${
        size === 'sm' ? 'size-7 text-2xs' : 'size-8 text-xs'
      }`}
    >
      {initials(name)}
    </span>
  );
}
