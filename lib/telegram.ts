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
