import type { SnippetSet } from './types';

export const javascript: SnippetSet = {
  short: [
    `export const groupBy = (array, keyFn) =>
  array.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});`,
    `export const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 5000, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, { ...fetchOptions, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};`,
    `export const shuffle = (arr) => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};`,
    `export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);`,
    `export const compose = (...fns) =>
  (initialVal) => fns.reduceRight((acc, fn) => fn(acc), initialVal);`,
    `export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};`,
  ],
  medium: [
    `export function debounce(fn, delay = 250) {
  let timerId;
  return function debounced(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

export function throttle(fn, limit = 200) {
  let inThrottle = false;
  return function throttled(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}`,
    `export function deepMerge(target, source) {
  const isObject = (item) => item && typeof item === 'object' && !Array.isArray(item);
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        output[key] = key in target ? deepMerge(target[key], source[key]) : source[key];
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
}`,
    `export async function mapConcurrent(items, concurrency, fn) {
  const results = new Array(items.length);
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  };

  const pool = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(pool);
  return results;
}`,
    `export function createObservable(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  return {
    get: () => value,
    set: (next) => {
      if (next !== value) {
        const prev = value;
        value = next;
        subscribers.forEach((fn) => fn(value, prev));
      }
    },
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}`,
    `export class StorageWithExpiry {
  static set(key, value, ttlMs) {
    const item = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  static get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const item = JSON.parse(raw);
      if (Date.now() > item.expiresAt) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch {
      return null;
    }
  }
}`,
    `export function memoize(fn, resolver = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return function memoized(...args) {
    const key = resolver(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
  ],
  long: [
    `export class WebSocketManager {
  #socket = null;
  #url;
  #reconnectAttempts = 0;
  #maxAttempts = 5;
  #handlers = new Map();

  constructor(url) {
    this.#url = url;
  }

  connect() {
    this.#socket = new WebSocket(this.#url);

    this.#socket.onopen = () => {
      this.#reconnectAttempts = 0;
      this.#emit('open');
    };

    this.#socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.#emit(data.type, data.payload);
      } catch {
        this.#emit('raw', event.data);
      }
    };

    this.#socket.onclose = () => {
      if (this.#reconnectAttempts < this.#maxAttempts) {
        const delay = Math.pow(2, this.#reconnectAttempts) * 1000;
        setTimeout(() => this.connect(), delay);
        this.#reconnectAttempts++;
      }
    };
  }

  on(event, callback) {
    (this.#handlers.get(event) ?? this.#handlers.set(event, new Set()).get(event)).add(callback);
    return () => this.#handlers.get(event)?.delete(callback);
  }

  #emit(event, ...args) {
    this.#handlers.get(event)?.forEach((fn) => fn(...args));
  }
}`,
    `export class AsyncTaskQueue {
  #queue = [];
  #running = 0;
  #concurrency;

  constructor(concurrency = 2) {
    this.#concurrency = concurrency;
  }

  add(asyncTask) {
    return new Promise((resolve, reject) => {
      this.#queue.push({ asyncTask, resolve, reject });
      this.#next();
    });
  }

  #next() {
    while (this.#running < this.#concurrency && this.#queue.length > 0) {
      const { asyncTask, resolve, reject } = this.#queue.shift();
      this.#running++;

      Promise.resolve()
        .then(() => asyncTask())
        .then(resolve, reject)
        .finally(() => {
          this.#running--;
          this.#next();
        });
    }
  }

  get pending() {
    return this.#queue.length;
  }
}`,
    `export function levenshteinDistance(strA, strB) {
  const m = strA.length;
  const n = strB.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (strA[i - 1] === strB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  return dp[m][n];
}`,
    `export function createReactiveStore(initialState, onUpdate) {
  const handler = {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (val !== null && typeof val === 'object') {
        return new Proxy(val, handler);
      }
      return val;
    },
    set(target, prop, value, receiver) {
      const oldVal = target[prop];
      const success = Reflect.set(target, prop, value, receiver);
      if (success && oldVal !== value) {
        onUpdate(prop, value, oldVal);
      }
      return success;
    },
  };
  return new Proxy(initialState, handler);
}`,
    `export class EventEmitter {
  #events = new Map();

  on(name, listener) {
    if (!this.#events.has(name)) this.#events.set(name, new Set());
    this.#events.get(name).add(listener);
    return () => this.off(name, listener);
  }

  off(name, listener) {
    this.#events.get(name)?.delete(listener);
  }

  once(name, listener) {
    const unsub = this.on(name, (...args) => {
      unsub();
      listener(...args);
    });
    return unsub;
  }

  emit(name, ...args) {
    this.#events.get(name)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (err) {
        console.error(\`Error in event listener '\${name}':\`, err);
      }
    });
  }
}`,
    `export function generateSparklineSvg(points, width = 200, height = 40) {
  if (points.length < 2) return '';
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return \`\${x.toFixed(1)},\${y.toFixed(1)}\`;
  });

  return \`<svg width="\${width}" height="\${height}" viewBox="0 0 \${width} \${height}" fill="none">
  <polyline points="\${coords.join(' ')}" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>\`;
}`,
    `export function createConcurrencyPool(concurrencyLimit) {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    if (activeCount >= concurrencyLimit || queue.length === 0) return;
    activeCount++;
    const { task, resolve, reject } = queue.shift();

    Promise.resolve()
      .then(task)
      .then(resolve, reject)
      .finally(() => {
        activeCount--;
        next();
      });
  };

  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      next();
    });
}`,
    `export async function* streamChunks(readableStream) {
  const reader = readableStream.getReader();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += new TextDecoder().decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) yield JSON.parse(line);
      }
    }
  } finally {
    reader.releaseLock();
  }
}`,
  ],
};
