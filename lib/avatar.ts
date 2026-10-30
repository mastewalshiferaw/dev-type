/** Server-safe avatar helpers (no React), shared by the app and the landing page. */

// Token colors (app/globals.css) that keep white initials above the 4.5:1 AA contrast ratio
const AVATAR_COLORS = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5'];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name.replace(/^@/, '').slice(0, 2).toUpperCase() || '?';
}
