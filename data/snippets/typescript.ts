import type { SnippetSet } from './types';

export const typescript: SnippetSet = {
  short: [
    `type Brand<K, T> = K & { readonly __brand: T };
export type UserId = Brand<string, 'UserId'>;
export type OrderId = Brand<string, 'OrderId'>;

export const makeUserId = (id: string): UserId => id as UserId;`,
    `export function isKeyOf<T extends object>(key: PropertyKey, obj: T): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}`,
    `export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handler);
  }, [value, delayMs]);
  return debounced;
}`,
    `export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;`,
    `export function assertNever(x: never, message = 'Unexpected unreachable branch'): never {
  throw new Error(\`\${message}: \${JSON.stringify(x)}\`);
}`,
    `export const calculateWpm = (charsTyped: number, timeSeconds: number): number => {
  if (timeSeconds <= 0) return 0;
  const standardWords = charsTyped / 5;
  const minutes = timeSeconds / 60;
  return Math.round((standardWords / minutes) * 10) / 10;
};`,
  ],
  medium: [
    `export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  factor?: number;
}

export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, initialDelayMs, factor = 2 } = options;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= factor;
    }
  }
  throw new Error('Unreachable retry termination');
}`,
    `export type Listener<T> = (event: T) => void;

export class TypedEventEmitter<TEvents extends Record<string, unknown>> {
  private listeners = new Map<keyof TEvents, Set<Listener<any>>>();

  on<K extends keyof TEvents>(event: K, listener: Listener<TEvents[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}`,
    `export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig<TBody = unknown> {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: TBody;
}

export async function apiRequest<TResponse, TBody = unknown>(
  url: string,
  config: RequestConfig<TBody>
): Promise<TResponse> {
  const res = await fetch(url, {
    method: config.method,
    headers: { 'Content-Type': 'application/json', ...config.headers },
    body: config.body ? JSON.stringify(config.body) : undefined,
  });

  if (!res.ok) {
    throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  }
  return res.json() as Promise<TResponse>;
}`,
    `export interface MetricPoint {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

export function aggregatePerformance(points: readonly MetricPoint[]): {
  averageWpm: number;
  peakWpm: number;
  consistencyScore: number;
} {
  if (points.length === 0) return { averageWpm: 0, peakWpm: 0, consistencyScore: 100 };
  const wpms = points.map((p) => p.wpm);
  const averageWpm = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  const peakWpm = Math.max(...wpms);
  const variance = wpms.reduce((acc, val) => acc + Math.pow(val - averageWpm, 2), 0) / wpms.length;
  const consistencyScore = Math.max(0, Math.round(100 - Math.sqrt(variance)));
  return { averageWpm: Math.round(averageWpm), peakWpm, consistencyScore };
}`,
    `export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) throw new RangeError('Chunk size must be positive');
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}`,
    `export function memoizeAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyResolver: (...args: TArgs) => string = (...args) => JSON.stringify(args)
): (...args: TArgs) => Promise<TResult> {
  const cache = new Map<string, Promise<TResult>>();
  return (...args: TArgs): Promise<TResult> => {
    const key = keyResolver(...args);
    if (cache.has(key)) return cache.get(key)!;
    const promise = fn(...args).catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, promise);
    return promise;
  };
}`,
  ],
  long: [
    `export class LRUCache<K, V> {
  private map = new Map<K, { value: V; expiresAt?: number }>();

  constructor(
    private readonly capacity: number,
    private readonly defaultTtlMs?: number
  ) {
    if (capacity <= 0) throw new Error('Capacity must be greater than zero');
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, ttlMs = this.defaultTtlMs): void {
    this.map.delete(key);
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.map.set(key, { value, expiresAt });
    if (this.map.size > this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
  }

  get size(): number {
    return this.map.size;
  }
}`,
    `export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Result = {
  ok: <T>(value: T): Result<T, never> => ({ ok: true, value }),
  err: <E>(error: E): Result<never, E> => ({ ok: false, error }),

  map: <T, U, E>(result: Result<T, E>, fn: (val: T) => U): Result<U, E> =>
    result.ok ? Result.ok(fn(result.value)) : result,

  flatMap: <T, U, E>(result: Result<T, E>, fn: (val: T) => Result<U, E>): Result<U, E> =>
    result.ok ? fn(result.value) : result,

  match: <T, E, R>(result: Result<T, E>, matcher: { ok: (val: T) => R; err: (err: E) => R }): R =>
    result.ok ? matcher.ok(result.value) : matcher.err(result.error),
};`,
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
    const dispatch = async (index: number): Promise<void> => {
      if (index >= this.stack.length) return;
      const fn = this.stack[index];
      await fn(context, () => dispatch(index + 1));
    };
    await dispatch(0);
  }
}`,
    `export interface StateMachineConfig<TState extends string, TEvent extends string> {
  initial: TState;
  transitions: Record<TState, Partial<Record<TEvent, TState>>>;
  onTransition?: (from: TState, to: TState, event: TEvent) => void;
}

export class StateMachine<TState extends string, TEvent extends string> {
  private current: TState;

  constructor(private readonly config: StateMachineConfig<TState, TEvent>) {
    this.current = config.initial;
  }

  getState(): TState {
    return this.current;
  }

  transition(event: TEvent): boolean {
    const allowed = this.config.transitions[this.current];
    const nextState = allowed?.[event];
    if (!nextState) return false;
    const previous = this.current;
    this.current = nextState;
    this.config.onTransition?.(previous, nextState, event);
    return true;
  }
}`,
    `export class PriorityQueue<T> {
  private heap: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  push(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(index: number): void {
    let child = index;
    while (child > 0) {
      const parent = Math.floor((child - 1) / 2);
      if (this.compare(this.heap[child], this.heap[parent]) >= 0) break;
      [this.heap[child], this.heap[parent]] = [this.heap[parent], this.heap[child]];
      child = parent;
    }
  }

  private siftDown(index: number): void {
    let parent = index;
    const len = this.heap.length;
    while (true) {
      let candidate = parent;
      const left = 2 * parent + 1;
      const right = 2 * parent + 2;
      if (left < len && this.compare(this.heap[left], this.heap[candidate]) < 0) candidate = left;
      if (right < len && this.compare(this.heap[right], this.heap[candidate]) < 0) candidate = right;
      if (candidate === parent) break;
      [this.heap[parent], this.heap[candidate]] = [this.heap[candidate], this.heap[parent]];
      parent = candidate;
    }
  }
}`,
    `export interface KeystrokeEvent {
  key: string;
  expected: string;
  timestamp: number;
}

export class KeystrokeAnalyzer {
  private events: KeystrokeEvent[] = [];

  record(key: string, expected: string, timestamp = performance.now()): void {
    this.events.push({ key, expected, timestamp });
  }

  calculateAccuracy(): number {
    if (this.events.length === 0) return 100;
    const correct = this.events.filter((e) => e.key === e.expected).length;
    return Math.round((correct / this.events.length) * 1000) / 10;
  }

  getKeyLatencyMap(): Map<string, number[]> {
    const latencies = new Map<string, number[]>();
    for (let i = 1; i < this.events.length; i++) {
      const delta = this.events[i].timestamp - this.events[i - 1].timestamp;
      const key = this.events[i].expected;
      if (!latencies.has(key)) latencies.set(key, []);
      latencies.get(key)!.push(delta);
    }
    return latencies;
  }
}`,
  ],
};
