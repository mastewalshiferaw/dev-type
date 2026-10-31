import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns true on the client after hydration, and false on the server / static prerendering.
 * Uses useSyncExternalStore to comply with React 19 and avoid cascading re-renders.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
