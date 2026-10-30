import type { SnippetSet } from './types';

export const python: SnippetSet = {
  short: [
    `def greet(name: str) -> str:
    return f"Hello, {name}!"`,
    `squares = {n: n * n for n in range(10)}
print(squares[7])`,
  ],
  medium: [
    `def get_evens(numbers):
    # Keep the even values, smallest first
    evens = [n for n in numbers if n % 2 == 0]
    return sorted(evens)`,
    `from pathlib import Path

def count_lines(path: Path) -> int:
    with path.open() as handle:
        return sum(1 for _ in handle)`,
  ],
  long: [
    `class Stack:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)

    def pop(self):
        if not self.items:
            raise IndexError("pop from empty stack")
        return self.items.pop()

    def __len__(self):
        return len(self.items)`,
    `import functools
import time

def timed(fn):
    """Print how long each call takes."""
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start  # seconds
        print(f"{fn.__name__} took {elapsed:.3f}s")
        return result
    return wrapper`,
  ],
};
