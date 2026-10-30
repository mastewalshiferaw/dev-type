import { useSyncExternalStore } from 'react';

/**
 * A tiny localStorage-backed store.
 *
 * Components read it through `useSyncExternalStore`, which renders `fallback` on the server and
 * during hydration, then switches to the stored value: no hydration mismatch, no effects.
 * Every read and write is wrapped so private mode or blocked storage degrades to in-memory state.
 */
export interface LocalStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  fallback: T;
}

export function createLocalStore<T>(key: string, fallback: T, parse: (raw: unknown) => T): LocalStore<T> {
  const listeners = new Set<() => void>();
  let cache: T | undefined;

  const read = (): T => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : parse(JSON.parse(raw));
    } catch {
      return fallback;
    }
  };

  const get = () => {
    if (typeof window === 'undefined') return fallback;
    if (cache === undefined) cache = read();
    return cache;
  };

  const emit = () => listeners.forEach((listener) => listener());

  const set: LocalStore<T>['set'] = (next) => {
    const value = typeof next === 'function' ? (next as (prev: T) => T)(get()) : next;
    cache = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or blocked: keep the in-memory value for this session
    }
    emit();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    cache = read();
    emit();
  };

  const subscribe = (listener: () => void) => {
    if (listeners.size === 0) window.addEventListener('storage', onStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener('storage', onStorage);
    };
  };

  return { get, set, subscribe, fallback };
}

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.fallback);
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
