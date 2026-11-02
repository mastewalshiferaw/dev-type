import type { SnippetSet } from './types';

export const typescript: SnippetSet = {
  short: [
    `type Point = { x: number; y: number };
const origin: Point = { x: 0, y: 0 };
export const distance = (p1: Point, p2: Point) => Math.hypot(p2.x - p1.x, p2.y - p1.y);`,
    `export const isDefined = <T,>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;`,
    `type Nullable<T> = T | null | undefined;
export type ApiResponse<T> = { data: Nullable<T>; status: number };`,
  ],
  medium: [
    `interface User {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
}

export function filterAdmins(users: User[]): User[] {
  return users.filter((u): u is User & { role: "admin" } => u.role === "admin");
}`,
    `export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}`,
    `type AsyncFn<T> = () => Promise<T>;

export async function withTimeout<T>(fn: AsyncFn<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout exceeded")), ms)
  );
  return Promise.race([fn(), timeout]);
}`,
  ],
  long: [
    `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export async function attempt<T>(task: () => Promise<T>): Promise<Result<T>> {
  try {
    const value = await task();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

const result = await attempt(() => fetch("/api/health"));
if (!result.ok) {
  console.error(result.error);
}`,
    `export class LRUCache<K, V> {
  private map = new Map<K, V>();

  constructor(private readonly capacity: number) {}

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
  }
}`,
    `export interface Middleware<TContext> {
  (context: TContext, next: () => Promise<void>): Promise<void>;
}

export class Pipeline<TContext> {
  private stack: Middleware<TContext>[] = [];

  use(middleware: Middleware<TContext>): this {
    this.stack.push(middleware);
    return this;
  }

  async execute(context: TContext): Promise<void> {
    const runner = async (index: number): Promise<void> => {
      const middleware = this.stack[index];
      if (!middleware) return;
      await middleware(context, () => runner(index + 1));
    };
    await runner(0);
  }
}`,
  ],
};
