import type { SnippetSet } from './types';

export const java: SnippetSet = {
  short: [
    `public record UserProfile(UUID id, String username, String email, Instant createdAt) {
    public UserProfile {
        Objects.requireNonNull(username, "Username must not be null");
        Objects.requireNonNull(email, "Email must not be null");
    }
}`,
    `public static double calculateWpm(int charactersTyped, double elapsedSeconds) {
    if (elapsedSeconds <= 0) return 0.0;
    double words = charactersTyped / 5.0;
    double minutes = elapsedSeconds / 60.0;
    return Math.round((words / minutes) * 10.0) / 10.0;
}`,
    `List<String> topLanguages = scores.stream()
    .filter(s -> s.accuracy() >= 95.0)
    .sorted(Comparator.comparingDouble(Score::wpm).reversed())
    .map(Score::language)
    .distinct()
    .limit(5)
    .toList();`,
    `public static String formatDuration(Duration duration) {
    long minutes = duration.toMinutes();
    long seconds = duration.minusMinutes(minutes).toSecondsPart();
    return String.format("%02d:%02d", minutes, seconds);
}`,
    `public sealed interface CommandResult permits Success, Failure {
    record Success(String payload) implements CommandResult {}
    record Failure(int code, String error) implements CommandResult {}
}`,
    `Thread.ofVirtual().start(() -> {
    System.out.println("Processing event on virtual thread: " + Thread.currentThread());
});`,
  ],
  medium: [
    `public static <T> CompletableFuture<T> withTimeout(
        CompletableFuture<T> future,
        Duration timeout,
        ScheduledExecutorService scheduler
    ) {
        CompletableFuture<T> timeoutFuture = new CompletableFuture<>();
        ScheduledFuture<?> scheduled = scheduler.schedule(
            () -> timeoutFuture.completeExceptionally(new TimeoutException("Operation timed out")),
            timeout.toMillis(),
            TimeUnit.MILLISECONDS
        );

        future.whenComplete((result, ex) -> scheduled.cancel(false));
        return CompletableFuture.anyOf(future, timeoutFuture).thenApply(obj -> (T) obj);
    }`,
    `public static String formatPattern(Object obj) {
    return switch (obj) {
        case Integer i -> String.format("int: %,d", i);
        case Long l -> String.format("long: %,d L", l);
        case Double d -> String.format("double: %.2f", d);
        case String s && !s.isBlank() -> "non-empty string: " + s;
        case null -> "null value";
        default -> obj.toString();
    };
}`,
    `public final class TokenBucket {
    private final double capacity;
    private final double refillPerSecond;
    private double tokens;
    private Instant lastRefill;

    public TokenBucket(double capacity, double refillPerSecond) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.tokens = capacity;
        this.lastRefill = Instant.now();
    }

    public synchronized boolean tryAcquire(double amount) {
        Instant now = Instant.now();
        double elapsed = Duration.between(lastRefill, now).toNanos() / 1_000_000_000.0;
        tokens = Math.min(capacity, tokens + elapsed * refillPerSecond);
        lastRefill = now;

        if (tokens >= amount) {
            tokens -= amount;
            return true;
        }
        return false;
    }
}`,
    `public static int binarySearch(int[] array, int target) {
    int low = 0;
    int high = array.length - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        int midVal = array[mid];

        if (midVal < target) {
            low = mid + 1;
        } else if (midVal > target) {
            high = mid - 1;
        } else {
            return mid;
        }
    }
    return -1;
}`,
    `public final class SimpleRateLimiter {
    private final Semaphore semaphore;
    private final ScheduledExecutorService scheduler;

    public SimpleRateLimiter(int permitsPerSecond) {
        this.semaphore = new Semaphore(permitsPerSecond);
        this.scheduler = Executors.newSingleThreadScheduledExecutor();
        this.scheduler.scheduleAtFixedRate(
            () -> semaphore.release(permitsPerSecond - semaphore.availablePermits()),
            1, 1, TimeUnit.SECONDS
        );
    }

    public boolean tryAcquire() {
        return semaphore.tryAcquire();
    }
}`,
    `public static <T> List<List<T>> partition(List<T> list, int size) {
    if (size <= 0) throw new IllegalArgumentException("Size must be positive");
    List<List<T>> parts = new ArrayList<>();
    for (int i = 0; i < list.size(); i += size) {
        parts.add(Collections.unmodifiableList(
            list.subList(i, Math.min(list.size(), i + size))
        ));
    }
    return Collections.unmodifiableList(parts);
}`,
  ],
  long: [
    `public class ConcurrentLruCache<K, V> {
    private final int capacity;
    private final ConcurrentHashMap<K, Node<K, V>> map;
    private final ReentrantLock lock = new ReentrantLock();
    private final Node<K, V> head = new Node<>(null, null);
    private final Node<K, V> tail = new Node<>(null, null);

    private static class Node<K, V> {
        K key;
        V value;
        Node<K, V> prev;
        Node<K, V> next;
        Node(K key, V value) { this.key = key; this.value = value; }
    }

    public ConcurrentLruCache(int capacity) {
        this.capacity = capacity;
        this.map = new ConcurrentHashMap<>(capacity);
        head.next = tail;
        tail.prev = head;
    }

    public Optional<V> get(K key) {
        Node<K, V> node = map.get(key);
        if (node == null) return Optional.empty();
        lock.lock();
        try {
            moveToHead(node);
            return Optional.of(node.value);
        } finally {
            lock.unlock();
        }
    }

    private void moveToHead(Node<K, V> node) {
        removeNode(node);
        addHead(node);
    }

    private void removeNode(Node<K, V> node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void addHead(Node<K, V> node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
}`,
    `public final class SafeBlockingQueue<T> {
    private final Queue<T> queue = new ArrayDeque<>();
    private final int capacity;
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public SafeBlockingQueue(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException();
        this.capacity = capacity;
    }

    public void put(T item) throws InterruptedException {
        Objects.requireNonNull(item);
        lock.lock();
        try {
            while (queue.size() >= capacity) {
                notFull.await();
            }
            queue.add(item);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public T take() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            T item = queue.poll();
            notFull.signal();
            return item;
        } finally {
            lock.unlock();
        }
    }
}`,
    `public class EventDispatcher {
    private final Map<Class<?>, List<Consumer<Object>>> listeners = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> void register(Class<T> eventType, Consumer<T> listener) {
        listeners.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
            .add((Consumer<Object>) listener);
    }

    public void dispatch(Object event) {
        List<Consumer<Object>> handlers = listeners.get(event.getClass());
        if (handlers != null) {
            for (Consumer<Object> handler : handlers) {
                try {
                    handler.accept(event);
                } catch (Exception ex) {
                    System.err.println("Error processing event: " + ex.getMessage());
                }
            }
        }
    }
}`,
    `public class MinHeap<T extends Comparable<T>> {
    private final List<T> heap = new ArrayList<>();

    public void insert(T value) {
        heap.add(value);
        siftUp(heap.size() - 1);
    }

    public Optional<T> extractMin() {
        if (heap.isEmpty()) return Optional.empty();
        T min = heap.get(0);
        T last = heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) {
            heap.set(0, last);
            siftDown(0);
        }
        return Optional.of(min);
    }

    private void siftUp(int index) {
        int current = index;
        while (current > 0) {
            int parent = (current - 1) / 2;
            if (heap.get(current).compareTo(heap.get(parent)) >= 0) break;
            Collections.swap(heap, current, parent);
            current = parent;
        }
    }

    private void siftDown(int index) {
        int current = index;
        int size = heap.size();
        while (2 * current + 1 < size) {
            int left = 2 * current + 1;
            int right = 2 * current + 2;
            int smallest = (right < size && heap.get(right).compareTo(heap.get(left)) < 0) ? right : left;
            if (heap.get(current).compareTo(heap.get(smallest)) <= 0) break;
            Collections.swap(heap, current, smallest);
            current = smallest;
        }
    }
}`,
    `public final class RetryTemplate {
    public static <T> T executeWithRetry(
        Callable<T> task,
        int maxAttempts,
        long backoffMillis
    ) throws Exception {
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return task.call();
            } catch (Exception ex) {
                lastException = ex;
                if (attempt == maxAttempts) break;
                Thread.sleep(backoffMillis * attempt);
            }
        }
        throw Objects.requireNonNull(lastException);
    }
}`,
    `public class JsonResponseBuilder {
    private final Map<String, Object> payload = new LinkedHashMap<>();
    private int statusCode = 200;

    public JsonResponseBuilder status(int code) {
        this.statusCode = code;
        return this;
    }

    public JsonResponseBuilder put(String key, Object value) {
        this.payload.put(key, value);
        return this;
    }

    public String build() {
        StringBuilder sb = new StringBuilder();
        sb.append("HTTP/1.1 ").append(statusCode).append("\\n");
        sb.append("Content-Type: application/json\\n\\n{");
        boolean first = true;
        for (var entry : payload.entrySet()) {
            if (!first) sb.append(", ");
            sb.append('"').append(entry.getKey()).append("\": \"")
              .append(entry.getValue()).append('"');
            first = false;
        }
        sb.append("}");
        return sb.toString();
    }
}`,
  ],
};
