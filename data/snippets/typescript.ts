import type { SnippetSet } from './types';

export const typescript: SnippetSet = {
  short: [
    `type Point = { x: number; y: number };
const origin: Point = { x: 0, y: 0 };`,
    `export const isDefined = <T,>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;`,
  ],
  medium: [
    `interface User {
  id: string;
  email: string;
  role: "admin" | "member";
}

const admins = (users: User[]) => users.filter((u) => u.role === "admin");`,
    `// Narrow an unknown error to something printable
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}`,
  ],
  long: [
    `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export async function attempt<T>(task: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await task() };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}

const result = await attempt(() => fetch("/api/health"));
if (!result.ok) console.error(result.error);`,
    `export class LRUCache<K, V> {
  private map = new Map<K, V>();

  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    // Re-insert to mark as most recently used
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value as K);
    }
  }
}`,
  ],
};
