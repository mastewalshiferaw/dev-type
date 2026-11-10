import type { SnippetSet } from './types';

export const python: SnippetSet = {
  short: [
    `@dataclass(slots=True, kw_only=True)
class UserProfile:
    id: UUID = field(default_factory=uuid4)
    username: str
    email: str
    is_active: bool = True
    role: str = "developer"`,
    `@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user`,
    `def batch_items(items: list[T], size: int) -> Generator[list[T], None, None]:
    for i in range(0, len(items), size):
        yield items[i : i + size]`,
    `def deep_merge(base: dict, update: dict) -> dict:
    result = base.copy()
    for key, value in update.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result`,
    `def parse_command(payload: dict[str, Any]) -> str:
    match payload:
        case {"action": "jump", "power": p} if p > 50:
            return "high_jump"
        case {"action": "run", "speed": s}:
            return f"running_at_{s}"
        case {"action": "idle"}:
            return "resting"
        case _:
            return "unknown_action"`,
    `async def fetch_all(urls: list[str], client: httpx.AsyncClient) -> list[dict]:
    tasks = [client.get(url) for url in urls]
    responses = await asyncio.gather(*tasks, return_exceptions=True)
    return [r.json() for r in responses if isinstance(r, httpx.Response) and r.is_success]`,
    `def memoize(func: Callable[..., Any]) -> Callable[..., Any]:
    cache: dict[tuple, Any] = {}
    @wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper`,
    `def read_config(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)`,
    `def slugify(text: str) -> str:
    text = re.sub(r"[^\\w\\s-]", "", text.strip().lower())
    return re.sub(r"[-\\s]+", "-", text)`,
    `class TaskStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"`,
    `def clamp(val: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(val, maximum))`,
    `@contextmanager
def temporary_env(key: str, value: str):
    original = os.environ.get(key)
    os.environ[key] = value
    try:
        yield
    finally:
        if original is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = original`,
  ],
  medium: [
    `class Debouncer:
    def __init__(self, wait_seconds: float):
        self.wait = wait_seconds
        self._timer: threading.Timer | None = None

    def debounce(self, fn: Callable[[], None]) -> None:
        if self._timer is not None:
            self._timer.cancel()
        self._timer = threading.Timer(self.wait, fn)
        self._timer.start()`,
    `def extract_bearer_token(auth_header: str | None) -> str:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise ValueError("Missing or invalid Authorization header")
    token = auth_header.removeprefix("Bearer ").strip()
    if not token or token.count(".") != 2:
        raise ValueError("Malformed JWT token structure")
    return token`,
    `class TreeNode:
    def __init__(self, val: int, left: "TreeNode | None" = None, right: "TreeNode | None" = None):
        self.val = val
        self.left = left
        self.right = right

def inorder_traversal(root: TreeNode | None) -> list[int]:
    result: list[int] = []
    def traverse(node: TreeNode | None):
        if node:
            traverse(node.left)
            result.append(node.val)
            traverse(node.right)
    traverse(root)
    return result`,
    `def get_env(key: str, default: T, caster: Callable[[str], T] = str) -> T:
    val = os.getenv(key)
    if val is None or val.strip() == "":
        return default
    try:
        return caster(val.strip())
    except (ValueError, TypeError):
        return default`,
    `class MovingAverage:
    def __init__(self, window_size: int):
        self.size = window_size
        self.queue: deque[float] = deque()
        self.total = 0.0

    def next(self, val: float) -> float:
        self.queue.append(val)
        self.total += val
        if len(self.queue) > self.size:
            self.total -= self.queue.popleft()
        return round(self.total / len(self.queue), 2)`,
    `def backoff_delay(attempt: int, base: float = 0.2, max_delay: float = 10.0) -> float:
    exp_delay = base * (2 ** attempt)
    jitter = random.uniform(0.5, 1.5)
    return min(max_delay, exp_delay * jitter)`,
    `class ExpiringCache:
    def __init__(self):
        self._data: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()

    def set(self, key: str, val: Any, ttl_seconds: float) -> None:
        with self._lock:
            self._data[key] = (val, time.monotonic() + ttl_seconds)

    def get(self, key: str) -> Any | None:
        with self._lock:
            if key not in self._data:
                return None
            val, expiry = self._data[key]
            if time.monotonic() > expiry:
                del self._data[key]
                return None
            return val`,
    `class AsyncEventEmitter:
    def __init__(self):
        self._subscribers: dict[str, list[Callable[..., Coroutine]]] = defaultdict(list)

    def on(self, event: str, handler: Callable[..., Coroutine]) -> None:
        self._subscribers[event].append(handler)

    async def emit(self, event: str, *args, **kwargs) -> None:
        tasks = [handler(*args, **kwargs) for handler in self._subscribers.get(event, [])]
        if tasks:
            await asyncio.gather(*tasks)`,
    `def stream_csv_records(filepath: Path) -> Generator[dict[str, str], None, None]:
    with filepath.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if any(row.values()):
                yield {k.strip(): v.strip() for k, v in row.items() if k}`,
    `def quicksort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
  ],
  long: [
    `class AsyncWorkerPool:
    def __init__(self, concurrency: int = 5):
        self.semaphore = asyncio.Semaphore(concurrency)
        self.results: list[dict[str, Any]] = []

    async def execute_task(self, task_id: int, payload: dict) -> dict[str, Any]:
        async with self.semaphore:
            await asyncio.sleep(0.05)
            record = {"task_id": task_id, "status": "processed", "data": payload}
            self.results.append(record)
            return record

    async def run_batch(self, items: list[dict]) -> list[dict[str, Any]]:
        tasks = [self.execute_task(idx, item) for idx, item in enumerate(items)]
        return await asyncio.gather(*tasks)`,
    `class PriorityTaskQueue:
    def __init__(self):
        self._heap: list[tuple[int, int, str]] = []
        self._counter = 0

    def push(self, task: str, priority: int) -> None:
        heapq.heappush(self._heap, (priority, self._counter, task))
        self._counter += 1

    def pop(self) -> str | None:
        if not self._heap:
            return None
        _, _, task = heapq.heappop(self._heap)
        return task

    def peek(self) -> str | None:
        return self._heap[0][2] if self._heap else None

    def __len__(self) -> int:
        return len(self._heap)`,
    `def find_shortest_path(graph: dict[str, list[str]], start: str, target: str) -> list[str] | None:
    if start == target:
        return [start]
    visited: set[str] = {start}
    queue: deque[list[str]] = deque([[start]])

    while queue:
        path = queue.popleft()
        current_node = path[-1]

        for neighbor in graph.get(current_node, []):
            if neighbor not in visited:
                new_path = path + [neighbor]
                if neighbor == target:
                    return new_path
                visited.add(neighbor)
                queue.append(new_path)
    return None`,
    `class DatabaseTransaction:
    def __init__(self, connection):
        self.conn = connection
        self.is_active = False

    def __enter__(self):
        self.conn.begin()
        self.is_active = True
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.conn.rollback()
            print(f"Transaction aborted due to error: {exc_val}")
            self.is_active = False
            return False
        self.conn.commit()
        self.is_active = False
        return True`,
    `class JsonLinesStreamer:
    def __init__(self, filepath: Path, required_keys: set[str]):
        self.path = filepath
        self.required = required_keys
        self.valid_count = 0
        self.skipped_count = 0

    def parse_stream(self) -> Generator[dict[str, Any], None, None]:
        with self.path.open("r", encoding="utf-8") as file:
            for line_no, raw_line in enumerate(file, start=1):
                clean = raw_line.strip()
                if not clean or clean.startswith("#"):
                    continue
                try:
                    obj = json.loads(clean)
                    if isinstance(obj, dict) and self.required.issubset(obj.keys()):
                        self.valid_count += 1
                        yield obj
                    else:
                        self.skipped_count += 1
                except json.JSONDecodeError:
                    self.skipped_count += 1`,
    `class TokenBucket:
    def __init__(self, capacity: int, fill_rate: float):
        self.capacity = float(capacity)
        self.tokens = float(capacity)
        self.fill_rate = fill_rate
        self.last_check = time.monotonic()
        self.lock = threading.Lock()

    def consume(self, amount: float = 1.0) -> bool:
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_check
            self.tokens = min(self.capacity, self.tokens + elapsed * self.fill_rate)
            self.last_check = now

            if self.tokens >= amount:
                self.tokens -= amount
                return True
            return False`,
    `class EventDispatcher:
    def __init__(self):
        self._listeners: dict[str, list[Callable[[Any], None]]] = defaultdict(list)

    def subscribe(self, event_name: str, callback: Callable[[Any], None]) -> Callable[[], None]:
        self._listeners[event_name].append(callback)
        def unsubscribe():
            if callback in self._listeners[event_name]:
                self._listeners[event_name].remove(callback)
        return unsubscribe

    def dispatch(self, event_name: str, payload: Any = None) -> int:
        callbacks = list(self._listeners.get(event_name, []))
        for callback in callbacks:
            callback(payload)
        return len(callbacks)`,
    `class Pipeline:
    def __init__(self, *steps: Callable[[Any], Any]):
        self.steps = steps

    def execute(self, initial_data: Any) -> Any:
        current = initial_data
        for step in self.steps:
            current = step(current)
        return current

    def pipe(self, step: Callable[[Any], Any]) -> "Pipeline":
        return Pipeline(*self.steps, step)`,
    `def bisect_find_first(items: list[T], predicate: Callable[[T], bool]) -> int | None:
    low = 0
    high = len(items) - 1
    result = None

    while low <= high:
        mid = (low + high) // 2
        if predicate(items[mid]):
            result = mid
            high = mid - 1
        else:
            low = mid + 1
    return result`,
    `@dataclass(slots=True)
class TypingStats:
    wpm: float
    raw_wpm: float
    accuracy_percent: float

def compute_typing_metrics(
    keystrokes: list[tuple[float, bool]],
    total_seconds: float
) -> TypingStats:
    if total_seconds <= 0 or not keystrokes:
        return TypingStats(0.0, 0.0, 100.0)

    total_chars = len(keystrokes)
    correct_chars = sum(1 for _, is_correct in keystrokes if is_correct)
    errors = total_chars - correct_chars

    minutes = total_seconds / 60.0
    raw_wpm = (total_chars / 5.0) / minutes
    net_wpm = max(0.0, (total_chars / 5.0 - errors) / minutes)
    accuracy = (correct_chars / total_chars) * 100.0

    return TypingStats(
        wpm=round(net_wpm, 1),
        raw_wpm=round(raw_wpm, 1),
        accuracy_percent=round(accuracy, 1)
    )`,
  ],
};
