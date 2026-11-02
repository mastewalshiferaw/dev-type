import type { SnippetSet } from './types';

export const javascript: SnippetSet = {
  short: [
    `const unique = (items) => [...new Set(items)];
const doubled = items.map((x) => x * 2);
console.log(unique(doubled));`,
    `const sum = (...numbers) => numbers.reduce((acc, curr) => acc + curr, 0);
export default sum;`,
    `const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
console.log(clamp(15, 0, 10));`,
  ],
  medium: [
    `const fetchUser = async (id) => {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) {
    throw new Error(\`Request failed with status \${res.status}\`);
  }
  return res.json();
};`,
    `function debounce(fn, ms = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}`,
    `function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
  );
}`,
  ],
  long: [
    `class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    return this.items.shift();
  }

  peek() {
    return this.items[0] ?? null;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  get size() {
    return this.items.length;
  }
}`,
    `export function groupBy(list, getKey) {
  const groups = new Map();
  for (const item of list) {
    const key = getKey(item);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }
  return Object.fromEntries(groups);
}

const byRole = groupBy(users, (u) => u.role);`,
    `class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
    return () => this.off(event, listener);
  }

  off(event, listener) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event, ...args) {
    const listeners = this.events.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(...args);
      }
    }
  }
}`,
  ],
};
