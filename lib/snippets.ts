export interface Snippet {
  id: string;
  lang: string;
  code: string;
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'js-1',
    lang: 'JavaScript',
    code: `const fetchUser = async (id) => {\n  const res = await fetch(\`/api/\${id}\`);\n  return await res.json();\n};`
  },
  {
    id: 'py-1',
    lang: 'Python',
    code: `def get_evens(numbers):\n    return [n for n in numbers if n % 2 == 0]`
  },
  {
    id: 'rust-1',
    lang: 'Rust',
    code: `fn double(val: Option<i32>) -> i32 {\n    match val {\n        Some(n) => n * 2,\n        None => 0,\n    }\n}`
  },
  {
    id: 'cpp-1',
    lang: 'C++',
    code: `int binary_search(int arr[], int n, int x) {\n    int l = 0, r = n - 1;\n    while (l <= r) return l;\n}`
  }
];