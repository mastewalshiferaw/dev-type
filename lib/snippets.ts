export type Language = 'All' | 'JavaScript' | 'Python' | 'Rust' | 'C++';
export type SnippetLength = 'short' | 'medium' | 'long';

export interface Snippet {
  id: string;
  lang: 'JavaScript' | 'Python' | 'Rust' | 'C++';
  length: SnippetLength;
  code: string;
}

export const SNIPPETS: Snippet[] = [
  // --- SHORT (2 - 3 lines) ---
  {
    id: 'js-short',
    lang: 'JavaScript',
    length: 'short',
    code: `const sum = (a, b) => a + b;\nexport default sum;`,
  },
  {
    id: 'py-short',
    lang: 'Python',
    length: 'short',
    code: `def greet(name: str) -> str:\n    return f"Hello, {name}!"`,
  },
  {
    id: 'rust-short',
    lang: 'Rust',
    length: 'short',
    code: `fn is_positive(x: i32) -> bool {\n    x > 0\n}`,
  },
  {
    id: 'cpp-short',
    lang: 'C++',
    length: 'short',
    code: `bool is_even(int n) {\n    return n % 2 == 0;\n}`,
  },

  // --- MEDIUM (4 - 6 lines) ---
  {
    id: 'js-med',
    lang: 'JavaScript',
    length: 'medium',
    code: `const fetchUser = async (id) => {\n  const res = await fetch(\`/api/\${id}\`);\n  if (!res.ok) throw new Error("Failed");\n  return await res.json();\n};`,
  },
  {
    id: 'py-med',
    lang: 'Python',
    length: 'medium',
    code: `def get_evens(numbers):\n    evens = [n for n in numbers if n % 2 == 0]\n    return sorted(evens)`,
  },
  {
    id: 'rust-med',
    lang: 'Rust',
    length: 'medium',
    code: `fn double(val: Option<i32>) -> i32 {\n    match val {\n        Some(n) => n * 2,\n        None => 0,\n    }\n}`,
  },
  {
    id: 'cpp-med',
    lang: 'C++',
    length: 'medium',
    code: `int binary_search(int arr[], int n, int x) {\n    int l = 0, r = n - 1;\n    while (l <= r) return l;\n    return -1;\n}`,
  },

  // --- LONG (7+ lines) ---
  {
    id: 'js-long',
    lang: 'JavaScript',
    length: 'long',
    code: `class Queue {\n  constructor() {\n    this.items = [];\n  }\n  enqueue(element) {\n    this.items.push(element);\n  }\n  dequeue() {\n    return this.items.shift();\n  }\n}`,
  },
  {
    id: 'py-long',
    lang: 'Python',
    length: 'long',
    code: `class Stack:\n    def __init__(self):\n        self.items = []\n    def push(self, val):\n        self.items.append(val)\n    def pop(self):\n        return self.items.pop()`,
  },
  {
    id: 'rust-long',
    lang: 'Rust',
    length: 'long',
    code: `struct Player {\n    username: String,\n    score: u64,\n}\nimpl Player {\n    fn add_score(&mut self, points: u64) {\n        self.score += points;\n    }\n}`,
  },
  {
    id: 'cpp-long',
    lang: 'C++',
    length: 'long',
    code: `template <typename T>\nT clamp(T val, T low, T high) {\n    if (val < low) return low;\n    if (val > high) return high;\n    return val;\n}`,
  },
];