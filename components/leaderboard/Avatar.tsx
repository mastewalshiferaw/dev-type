'use client';

import { useState } from 'react';
import { avatarColor, initials } from '@/lib/avatar';
import { cleanTelegramChannel } from '@/lib/telegram';

export default function Avatar({
  name,
  channel,
  src,
  size = 'md',
}: {
  name: string;
  channel?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [imgError, setImgError] = useState(false);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setImgError(false);
  }

  const sizeClasses =
    size === 'sm'
      ? 'size-7 text-2xs'
      : size === 'lg'
        ? 'size-12 text-sm'
        : 'size-8 text-xs';

  if (src && !imgError) {
    return (
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-line ${sizeClasses}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          className="size-full rounded-full object-cover"
        />
      </span>
    );
  }

  // If someone doesn't have a photo on their channel or profile,
  // put the first letter (or two letters) as a profile avatar.
  // Prefer channel if provided, otherwise fallback to name.
  const cleanChannel = cleanTelegramChannel(channel);
  const targetName = cleanChannel || name;

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-avatar-ink ${avatarColor(targetName)} ${sizeClasses}`}
    >
      {initials(targetName)}
    </span>
  );
}
