export function cleanTelegramChannel(raw?: string | null): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/^t\.me\//i, '');
  cleaned = cleaned.replace(/^telegram\.me\//i, '');
  cleaned = cleaned.replace(/^@+/, '');
  cleaned = cleaned.split('/')[0].split('?')[0];
  return cleaned.trim();
}

export const TG_CHANNEL_PATTERN = /^[a-zA-Z0-9_]{4,32}$/;

export async function fetchTelegramAvatar(
  channelInput: string
): Promise<{
  avatarUrl: string | null;
  title?: string | null;
  hasCustomPhoto?: boolean;
  initials?: string | null;
  error?: string;
}> {
  const channel = cleanTelegramChannel(channelInput);
  if (!channel) return { avatarUrl: null };
  try {
    const res = await fetch(`/api/telegram-avatar?channel=${encodeURIComponent(channel)}`);
    if (!res.ok) {
      return { avatarUrl: null, error: `Server error ${res.status}` };
    }
    const data = await res.json();
    return {
      avatarUrl: data.avatarUrl || null,
      title: data.title || null,
      hasCustomPhoto: Boolean(data.hasCustomPhoto),
      initials: data.initials || null,
      error: data.error,
    };
  } catch (err) {
    return { avatarUrl: null, error: err instanceof Error ? err.message : 'Network error' };
  }
}
