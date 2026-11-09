'use client';

import { useEffect, useState } from 'react';
import { avatarColor, initials } from '@/lib/avatar';

export default function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

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

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-avatar-ink ${avatarColor(name)} ${sizeClasses}`}
    >
      {initials(name)}
    </span>
  );
}
