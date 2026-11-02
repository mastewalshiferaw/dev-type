import type { SnippetSet } from './types';

export const python: SnippetSet = {
  short: [
    `def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("world"))`,
    `squares = {n: n * n for n in range(10) if n % 2 == 0}
print(squares[4])`,
    `def clamp(val: float, low: float, high: float) -> float:
    return max(low, min(val, high))`,
  ],
  medium: [
    `def get_evens(numbers: list[int]) -> list[int]:
    evens = [n for n in numbers if n % 2 == 0]
    return sorted(evens)

result = get_evens([9, 2, 8, 3, 1, 4])
print(result)`,
    `from pathlib import Path

def count_lines(path: Path) -> int:
    with path.open("r", encoding="utf-8") as handle:
        return sum(1 for _ in handle)

def read_json_lines(path: Path) -> list[str]:
    return [line.strip() for line in path.read_text().splitlines() if line.strip()]`,
    `from dataclasses import dataclass

@dataclass(frozen=True)
class UserProfile:
    id: str
    username: str
    email: str
    is_active: bool = True

    def display(self) -> str:
        return f"{self.username} <{self.email}>"`,
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

    def peek(self):
        if not self.items:
            return None
        return self.items[-1]

    def __len__(self):
        return len(self.items)

    def is_empty(self):
        return len(self.items) == 0`,
    `import functools
import time

def timed(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{fn.__name__} took {elapsed:.3f}s")
        return result
    return wrapper

@timed
def compute_primes(limit: int) -> list[int]:
    primes = []
    for num in range(2, limit):
        if all(num % p != 0 for p in primes if p * p <= num):
            primes.append(num)
    return primes`,
    `import asyncio
from typing import AsyncGenerator

async def fetch_batches(items: list[int], size: int) -> AsyncGenerator[list[int], None]:
    for i in range(0, len(items), size):
        await asyncio.sleep(0.01)
        yield items[i : i + size]

async def process_all(items: list[int]) -> list[int]:
    results = []
    async for batch in fetch_batches(items, 10):
        results.extend([x * 2 for x in batch])
    return results`,
  ],
};
