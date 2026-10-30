import type { SnippetSet } from './types';

export const javascript: SnippetSet = {
  short: [
    `const sum = (a, b) => a + b;
export default sum;`,
    `const unique = (items) => [...new Set(items)];
console.log(unique([1, 1, 2, 3]));`,
  ],
  medium: [
    `const fetchUser = async (id) => {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
};`,
    `// Wait until calls stop for \`ms\` before running fn
function debounce(fn, ms = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
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
    return this.items.shift();
  }
  get size() {
    return this.items.length;
  }
}`,
    `export function groupBy(list, getKey) {
  const groups = new Map();
  for (const item of list) {
    const key = getKey(item);
    // Create the bucket on first sight
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return Object.fromEntries(groups);
}

const byRole = groupBy(users, (u) => u.role);`,
  ],
};
