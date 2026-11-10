/** Server-safe avatar helpers (no React), shared by the app and the landing page. */

// Token colors (app/globals.css) that keep white initials above the 4.5:1 AA contrast ratio
const AVATAR_COLORS = ['bg-avatar-1', 'bg-avatar-2', 'bg-avatar-3', 'bg-avatar-4', 'bg-avatar-5'];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Returns 1 or 2 uppercase initials for a name or channel.
 * If 2 or more words/tokens are present, takes the first letter of each.
 * If a single word is present, takes the first 2 letters (or 1 letter if length is 1).
 */
export function initials(name?: string | null): string {
  if (!name) return '?';
  let clean = name.trim();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.replace(/^(?:www\.)?t\.me\//i, '');
  clean = clean.replace(/^telegram\.me\//i, '');
  clean = clean.replace(/^@+/, '');

  if (!clean) return '?';

  // Split by whitespace, underscores, hyphens, or dots to extract distinct words
  const parts = clean.split(/[\s_\-.]+/).filter((p) => /[a-zA-Z0-9]/.test(p));
  if (parts.length >= 2 && parts[0] && parts[1]) {
    const first = parts[0].match(/[a-zA-Z0-9]/)?.[0] || '';
    const second = parts[1].match(/[a-zA-Z0-9]/)?.[0] || '';
    if (first && second) {
      return `${first}${second}`.toUpperCase();
    }
  }

  // Single word: take first 2 letters (or 1 letter if length is 1)
  const lettersOnly = clean.replace(/[^a-zA-Z0-9]/g, '');
  if (lettersOnly.length >= 2) {
    return lettersOnly.slice(0, 2).toUpperCase();
  }
  if (lettersOnly.length === 1) {
    return lettersOnly.toUpperCase();
  }

  return clean.slice(0, 2).toUpperCase() || '?';
}

const TELEGRAM_GRADIENTS = [
  ['#38bdf8', '#0284c7'], // Sky blue
  ['#818cf8', '#4f46e5'], // Indigo
  ['#c084fc', '#7c3aed'], // Purple
  ['#34d399', '#059669'], // Emerald
  ['#fbbf24', '#d97706'], // Amber
  ['#f472b6', '#e11d48'], // Rose
  ['#2dd4bf', '#0d9488'], // Cyan
];

/**
 * Generate a Telegram-style SVG letter avatar data URL.
 * Compact (~280 bytes), crisp on retina, safe for <img src="..." />.
 */
export function generateLetterAvatarSvg(letters: string, seed: string = letters): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const [c1, c2] = TELEGRAM_GRADIENTS[Math.abs(hash) % TELEGRAM_GRADIENTS.length];
  const fontSize = letters.length === 1 ? 44 : 36;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><circle cx="40" cy="40" r="40" fill="url(#g)"/><text x="40" y="44" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-weight="700" font-size="${fontSize}">${letters}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
