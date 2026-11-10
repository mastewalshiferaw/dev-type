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

export function getTelegramVerificationCode(userId: string): string {
  if (!userId) return '';
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `devtype-${cleanId}`;
}

export async function verifyTelegramChannel(
  channelInput: string,
  userId: string
): Promise<{
  success: boolean;
  verified?: boolean;
  channel?: string;
  avatarUrl?: string | null;
  error?: string;
}> {
  const channel = cleanTelegramChannel(channelInput);
  if (!channel) return { success: false, error: 'Channel handle is required' };
  if (!userId) return { success: false, error: 'You must be signed in to verify a channel' };

  try {
    const res = await fetch('/api/telegram-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel,
        userId,
        code: getTelegramVerificationCode(userId),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || `Verification failed (${res.status})` };
    }
    return data;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error during verification',
    };
  }
}

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
