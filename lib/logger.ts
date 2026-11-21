/**
 * Structured server logging helper with automatic redaction
 * for tokens, passwords, recovery links, and sensitive identifiers.
 */

const SENSITIVE_PATTERNS = [
  /token=[a-zA-Z0-9._-]+/gi,
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /action_link=[^\s&]+/gi,
  /recovery[^\s]*/gi,
  /password=[^\s&]+/gi,
  /secret[^\s&]*/gi,
  /key=[a-zA-Z0-9._-]+/gi,
];

export function redactSensitive(input: string): string {
  let result = input;
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    const safeMsg = redactSensitive(message);
    if (meta) {
      console.info(safeMsg, sanitizeMeta(meta));
    } else {
      console.info(safeMsg);
    }
  },
  warn(message: string, meta?: Record<string, unknown>) {
    const safeMsg = redactSensitive(message);
    if (meta) {
      console.warn(safeMsg, sanitizeMeta(meta));
    } else {
      console.warn(safeMsg);
    }
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>) {
    const safeMsg = redactSensitive(message);
    const errMsg = error instanceof Error ? redactSensitive(error.message) : '';
    console.error(safeMsg, errMsg, meta ? sanitizeMeta(meta) : '');
  },
};

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    const lowerKey = k.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey.includes('link') ||
      lowerKey.includes('auth')
    ) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'string') {
      clean[k] = redactSensitive(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}
