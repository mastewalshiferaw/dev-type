import type { SnippetSet } from './types';

export const python: SnippetSet = {
  short: [
    `def match_response(status_code: int) -> str:
    match status_code:
        case 200 | 201:
            return "Success"
        case 400 | 422:
            return "Client Validation Error"
        case 401 | 403:
            return "Authentication Required"
        case 404:
            return "Resource Not Found"
        case _:
            return "Unhandled Status"`,
    `from contextlib import contextmanager
import time

@contextmanager
def execution_timer(label: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = (time.perf_counter() - start) * 1000
        print(f"[{label}] Finished in {elapsed:.2f}ms")`,
    `from dataclasses import dataclass, field

@dataclass(slots=True, frozen=True)
class SessionConfig:
    duration_seconds: int = 60
    language: str = "python"
    allowed_tags: list[str] = field(default_factory=lambda: ["algorithms", "web"])
    require_punctuation: bool = True`,
    `from itertools import chain

def flatten_matrix(matrix: list[list[int]]) -> list[int]:
    return list(chain.from_iterable(matrix))

evens = [x for x in flatten_matrix([[1, 2], [3, 4], [5, 6]]) if x % 2 == 0]`,
    `def calculate_metrics(typed_chars: int, errors: int, elapsed_sec: float) -> dict[str, float]:
    if elapsed_sec <= 0:
        return {"wpm": 0.0, "acc": 100.0}
    gross_wpm = (typed_chars / 5.0) / (elapsed_sec / 60.0)
    net_wpm = max(0.0, gross_wpm - (errors / (elapsed_sec / 60.0)))
    accuracy = max(0.0, ((typed_chars - errors) / typed_chars) * 100) if typed_chars else 100.0
    return {"wpm": round(net_wpm, 1), "acc": round(accuracy, 1)}`,
    `from typing import TypeVar, Sequence

T = TypeVar("T")

def chunk_sequence(seq: Sequence[T], chunk_size: int) -> list[Sequence[T]]:
    return [seq[i : i + chunk_size] for i in range(0, len(seq), chunk_size)]`,
  ],
  medium: [
    `import functools
import random
import time
from typing import Callable, TypeVar

R = TypeVar("R")

def retry_with_backoff(max_retries: int = 3, base_delay: float = 0.5):
    def decorator(func: Callable[..., R]) -> Callable[..., R]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> R:
            delay = base_delay
            for attempt in range(1, max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as err:
                    if attempt == max_retries:
                        raise err
                    jitter = random.uniform(0.8, 1.2)
                    time.sleep(delay * jitter)
                    delay *= 2
            raise RuntimeError("Unreachable")
        return wrapper
    return decorator`,
    `import hashlib
from pathlib import Path

def compute_checksums(directory: Path, pattern: str = "*.py") -> dict[str, str]:
    hashes = {}
    for filepath in sorted(directory.rglob(pattern)):
        if filepath.is_file():
            hasher = hashlib.sha256()
            with filepath.open("rb") as f:
                while chunk := f.read(65536):
                    hasher.update(chunk)
            hashes[filepath.name] = hasher.hexdigest()
    return hashes`,
    `class CircularBuffer:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.buffer = [None] * capacity
        self.head = 0
        self.tail = 0
        self.size = 0

    def append(self, item):
        self.buffer[self.tail] = item
        self.tail = (self.tail + 1) % self.capacity
        if self.size < self.capacity:
            self.size += 1
        else:
            self.head = (self.head + 1) % self.capacity

    def get_all(self):
        return [self.buffer[(self.head + i) % self.capacity] for i in range(self.size)]`,
    `import asyncio
from typing import Any

async def fetch_api_endpoint(url: str, session: Any, timeout: float = 5.0) -> dict[str, Any]:
    try:
        async with asyncio.timeout(timeout):
            async with session.get(url) as response:
                response.raise_for_status()
                return await response.json()
    except TimeoutError:
        return {"error": f"Request to {url} timed out"}
    except Exception as exc:
        return {"error": str(exc)}`,
    `from bisect import bisect_left
from typing import Sequence, TypeVar

T = TypeVar("T")

def binary_search(elements: Sequence[T], target: T) -> int | None:
    index = bisect_left(elements, target)
    if index < len(elements) and elements[index] == target:
        return index
    return None`,
    `from collections import Counter
import re

def analyze_word_frequency(text: str, top_n: int = 10) -> list[tuple[str, int]]:
    tokens = re.findall(r"\\b[a-zA-Z_][a-zA-Z0-9_]*\\b", text.lower())
    counter = Counter(tokens)
    return counter.most_common(top_n)`,
  ],
  long: [
    `import threading
import time

class TokenBucketRateLimiter:
    def __init__(self, capacity: float, refill_rate_per_sec: float):
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.refill_rate = float(refill_rate_per_sec)
        self.last_update = time.monotonic()
        self.lock = threading.Lock()

    def allow_request(self, tokens_needed: float = 1.0) -> bool:
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            self.last_update = now

            if self.tokens >= tokens_needed:
                self.tokens -= tokens_needed
                return True
            return False`,
    `from typing import Generic, TypeVar

K = TypeVar("K")
V = TypeVar("V")

class Node(Generic[K, V]):
    def __init__(self, key: K, val: V):
        self.key = key
        self.val = val
        self.prev: Node[K, V] | None = None
        self.next: Node[K, V] | None = None

class LRUCache(Generic[K, V]):
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache: dict[K, Node[K, V]] = {}
        self.head = Node(None, None)  # type: ignore
        self.tail = Node(None, None)  # type: ignore
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node[K, V]) -> None:
        if node.prev and node.next:
            node.prev.next = node.next
            node.next.prev = node.prev

    def _add(self, node: Node[K, V]) -> None:
        node.prev = self.head
        node.next = self.head.next
        if self.head.next:
            self.head.next.prev = node
        self.head.next = node`,
    `import asyncio

async def worker_node(worker_id: int, queue: asyncio.Queue[int], output: list[int]):
    while True:
        try:
            item = await queue.get()
            # Simulate CPU or network processing
            processed = item * item + 3
            output.append(processed)
            queue.task_done()
        except asyncio.CancelledError:
            break

async def process_pipeline(inputs: list[int], num_workers: int = 4) -> list[int]:
    queue: asyncio.Queue[int] = asyncio.Queue()
    output: list[int] = []

    workers = [
        asyncio.create_task(worker_node(i, queue, output))
        for i in range(num_workers)
    ]

    for item in inputs:
        await queue.put(item)

    await queue.join()
    for worker in workers:
        worker.cancel()
    await asyncio.gather(*workers, return_exceptions=True)
    return output`,
    `class DependencyContainer:
    def __init__(self):
        self._services = {}
        self._factories = {}

    def register_singleton(self, service_type: type, instance: object) -> None:
        self._services[service_type] = instance

    def register_factory(self, service_type: type, factory_func) -> None:
        self._factories[service_type] = factory_func

    def resolve(self, service_type: type):
        if service_type in self._services:
            return self._services[service_type]
        if service_type in self._factories:
            return self._factories[service_type](self)
        raise KeyError(f"Service {service_type.__name__} not registered")`,
    `class PolishNotationEvaluator:
    OPERATORS = {
        "+": lambda a, b: a + b,
        "-": lambda a, b: a - b,
        "*": lambda a, b: a * b,
        "/": lambda a, b: int(a / b),
    }

    def evaluate(self, tokens: list[str]) -> int:
        stack: list[int] = []
        for token in tokens:
            if token in self.OPERATORS:
                b = stack.pop()
                a = stack.pop()
                result = self.OPERATORS[token](a, b)
                stack.append(result)
            else:
                stack.append(int(token))
        return stack[0]`,
    `from dataclasses import dataclass

@dataclass
class TypingSnapshot:
    timestamp_ms: float
    cursor_position: int
    raw_characters_typed: int
    unforced_errors: int

class SessionTelemetry:
    def __init__(self):
        self.snapshots: list[TypingSnapshot] = []

    def log_keystroke(self, pos: int, total_chars: int, errors: int, ts: float):
        self.snapshots.append(TypingSnapshot(ts, pos, total_chars, errors))

    def compute_acceleration(self) -> list[float]:
        if len(self.snapshots) < 2:
            return []
        rates = []
        for i in range(1, len(self.snapshots)):
            prev, curr = self.snapshots[i - 1], self.snapshots[i]
            delta_t = (curr.timestamp_ms - prev.timestamp_ms) / 1000.0
            if delta_t > 0:
                chars_per_sec = (curr.raw_characters_typed - prev.raw_characters_typed) / delta_t
                rates.append(chars_per_sec * 12.0)  # Convert to WPM
        return rates`,
    `from collections import OrderedDict
from functools import wraps

class LRUCache:
    def __init__(self, capacity: int = 128):
        self.capacity = capacity
        self.cache: OrderedDict[str, object] = OrderedDict()

    def get(self, key: str) -> object | None:
        if key not in self.cache:
            return None
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, value: object) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)`,
    `import asyncio
import time
from collections import deque

class SlidingWindowLimiter:
    def __init__(self, max_calls: int, window_seconds: float):
        self.max_calls = max_calls
        self.window = window_seconds
        self.timestamps: deque[float] = deque()
        self.lock = asyncio.Lock()

    async def acquire(self) -> bool:
        async with self.lock:
            now = time.monotonic()
            while self.timestamps and now - self.timestamps[0] > self.window:
                self.timestamps.popleft()
            if len(self.timestamps) < self.max_calls:
                self.timestamps.append(now)
                return True
            return False`,
    `class TrieAutocomplete:
    def __init__(self):
        self.children: dict[str, TrieAutocomplete] = {}
        self.is_word = False
        self.frequency = 0

    def insert(self, word: str, score: int = 1) -> None:
        node = self
        for char in word:
            if char not in node.children:
                node.children[char] = TrieAutocomplete()
            node = node.children[char]
        node.is_word = True
        node.frequency += score

    def search_prefix(self, prefix: str) -> list[str]:
        node = self
        for char in prefix:
            if char not in node.children:
                return []
            node = node.children[char]
        results: list[tuple[str, int]] = []
        self._collect(node, prefix, results)
        results.sort(key=lambda item: item[1], reverse=True)
        return [w for w, _ in results[:5]]

    def _collect(self, node: 'TrieAutocomplete', path: str, results: list) -> None:
        if node.is_word:
            results.append((path, node.frequency))
        for char, child in node.children.items():
            self._collect(child, path + char, results)`,
  ],
};
