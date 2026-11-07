import type { SnippetSet } from './types';

export const kotlin: SnippetSet = {
  short: [
    `fun calculateAccuracy(correctChars: Int, totalChars: Int): Double {
    if (totalChars <= 0) return 100.0
    return ((correctChars.toDouble() / totalChars) * 100.0).coerceIn(0.0, 100.0)
}`,
    `data class TypingScore(
    val username: String,
    val wpm: Double,
    val accuracy: Double,
    val language: String,
    val isVerified: Boolean = false
)`,
    `val activeUsers = users
    .filter { it.isActive && it.lastSeenDaysAgo <= 14 }
    .sortedByDescending { it.score }
    .take(20)
    .map { it.username }`,
    `sealed class NetworkState<out T> {
    data object Loading : NetworkState<Nothing>()
    data class Success<out T>(val data: T) : NetworkState<T>()
    data class Error(val throwable: Throwable) : NetworkState<Nothing>()
}`,
    `suspend fun fetchUserProfile(userId: String): Result<UserProfile> = runCatching {
    client.get("/api/v1/users/$userId").body()
}`,
    `@JvmInline
value class Wpm(val value: Double) {
    init {
        require(value >= 0.0) { "WPM cannot be negative" }
    }
}`,
  ],
  medium: [
    `class TokenBucket(
    private val capacity: Double,
    private val refillRatePerSecond: Double
) {
    private var tokens = capacity
    private var lastRefillTimestamp = System.nanoTime()

    @Synchronized
    fun tryConsume(amount: Double = 1.0): Boolean {
        val now = System.nanoTime()
        val elapsedSeconds = (now - lastRefillTimestamp) / 1_000_000_000.0
        tokens = (tokens + elapsedSeconds * refillRatePerSecond).coerceAtMost(capacity)
        lastRefillTimestamp = now

        return if (tokens >= amount) {
            tokens -= amount
            true
        } else {
            false
        }
    }
}`,
    `suspend fun <T> retryWithExponentialBackoff(
    times: Int = 3,
    initialDelayMs: Long = 100,
    factor: Double = 2.0,
    block: suspend () -> T
): T {
    var currentDelay = initialDelayMs
    repeat(times - 1) {
        try {
            return block()
        } catch (e: Exception) {
            delay(currentDelay)
            currentDelay = (currentDelay * factor).toLong()
        }
    }
    return block()
}`,
    `fun <T> List<T>.binarySearchBy(target: Comparable<T>): Int {
    var low = 0
    var high = size - 1

    while (low <= high) {
        val mid = (low + high) ushr 1
        val cmp = target.compareTo(this[mid])
        when {
            cmp > 0 -> low = mid + 1
            cmp < 0 -> high = mid - 1
            else -> return mid
        }
    }
    return -(low + 1)
}`,
    `fun flowOfTicks(periodMs: Long): Flow<Long> = flow {
    var counter = 0L
    while (currentCoroutineContext().isActive) {
        emit(counter++)
        delay(periodMs)
    }
}.flowOn(Dispatchers.Default)`,
    `class MemoryCache<K : Any, V : Any>(private val defaultTtlMs: Long = 60_000) {
    private data class CacheEntry<V>(val value: V, val expiresAt: Long)
    private val store = ConcurrentHashMap<K, CacheEntry<V>>()

    fun put(key: K, value: V, ttlMs: Long = defaultTtlMs) {
        store[key] = CacheEntry(value, System.currentTimeMillis() + ttlMs)
    }

    fun get(key: K): V? {
        val entry = store[key] ?: return null
        if (System.currentTimeMillis() > entry.expiresAt) {
            store.remove(key)
            return null
        }
        return entry.value
    }
}`,
    `fun formatFileSize(bytes: Long): String = when {
    bytes >= 1_073_741_824 -> "%.2f GB".format(bytes / 1_073_741_824.0)
    bytes >= 1_048_576 -> "%.2f MB".format(bytes / 1_048_576.0)
    bytes >= 1_024 -> "%.2f KB".format(bytes / 1_024.0)
    else -> "$bytes B"
}`,
  ],
  long: [
    `class LruCache<K : Any, V : Any>(private val capacity: Int) {
    init {
        require(capacity > 0) { "Capacity must be greater than zero" }
    }

    private val map = LinkedHashMap<K, V>(capacity, 0.75f, true)

    @Synchronized
    fun get(key: K): V? = map[key]

    @Synchronized
    fun put(key: K, value: V) {
        if (map.size >= capacity && !map.containsKey(key)) {
            val eldestKey = map.keys.firstOrNull()
            if (eldestKey != null) {
                map.remove(eldestKey)
            }
        }
        map[key] = value
    }

    @Synchronized
    fun remove(key: K): V? = map.remove(key)

    @Synchronized
    fun clear() = map.clear()

    @Synchronized
    val size: Int get() = map.size
}`,
    `class CoroutineWorkerPool<T, R>(
    private val concurrency: Int,
    private val scope: CoroutineScope,
    private val transform: suspend (T) -> R
) {
    private val channel = Channel<T>(Channel.BUFFERED)
    private val resultsChannel = Channel<R>(Channel.BUFFERED)

    init {
        repeat(concurrency) {
            scope.launch {
                for (item in channel) {
                    val result = transform(item)
                    resultsChannel.send(result)
                }
            }
        }
    }

    suspend fun enqueue(item: T) = channel.send(item)

    fun results(): Flow<R> = resultsChannel.receiveAsFlow()

    fun close() {
        channel.close()
    }
}`,
    `sealed interface TypingAction {
    data class InsertChar(val char: Char, val timestamp: Long) : TypingAction
    data class Backspace(val timestamp: Long) : TypingAction
    data object Reset : TypingAction
}

data class TypingState(
    val buffer: String = "",
    val errorIndices: Set<Int> = emptySet(),
    val totalKeystrokes: Int = 0
)

fun typingReducer(state: TypingState, action: TypingAction, targetText: String): TypingState =
    when (action) {
        is TypingAction.InsertChar -> {
            val nextIndex = state.buffer.length
            val isError = nextIndex >= targetText.length || targetText[nextIndex] != action.char
            val newErrors = if (isError) state.errorIndices + nextIndex else state.errorIndices
            state.copy(
                buffer = state.buffer + action.char,
                errorIndices = newErrors,
                totalKeystrokes = state.totalKeystrokes + 1
            )
        }
        is TypingAction.Backspace -> {
            if (state.buffer.isEmpty()) state
            else {
                val lastIndex = state.buffer.length - 1
                state.copy(
                    buffer = state.buffer.dropLast(1),
                    errorIndices = state.errorIndices - lastIndex
                )
            }
        }
        is TypingAction.Reset -> TypingState()
    }`,
    `class MinHeap<T : Comparable<T>> {
    private val items = ArrayList<T>()

    val size: Int get() = items.size
    fun isEmpty(): Boolean = items.isEmpty()

    fun push(item: T) {
        items.add(item)
        siftUp(items.lastIndex)
    }

    fun pop(): T? {
        if (items.isEmpty()) return null
        val root = items.first()
        val last = items.removeAt(items.lastIndex)
        if (items.isNotEmpty()) {
            items[0] = last
            siftDown(0)
        }
        return root
    }

    private fun siftUp(index: Int) {
        var curr = index
        while (curr > 0) {
            val parent = (curr - 1) / 2
            if (items[curr] >= items[parent]) break
            items[curr] = items[parent].also { items[parent] = items[curr] }
            curr = parent
        }
    }

    private fun siftDown(index: Int) {
        var curr = index
        while (2 * curr + 1 < items.size) {
            var smallest = 2 * curr + 1
            val right = smallest + 1
            if (right < items.size && items[right] < items[smallest]) smallest = right
            if (items[curr] <= items[smallest]) break
            items[curr] = items[smallest].also { items[smallest] = items[curr] }
            curr = smallest
        }
    }
}`,
    `class EventBus {
    private val subscribers = ConcurrentHashMap<KClass<*>, MutableList<suspend (Any) -> Unit>>()

    inline fun <reified T : Any> subscribe(noinline handler: suspend (T) -> Unit) {
        val list = subscribers.getOrPut(T::class) { CopyOnWriteArrayList() }
        @Suppress("UNCHECKED_CAST")
        list.add(handler as suspend (Any) -> Unit)
    }

    suspend fun publish(event: Any) {
        val handlers = subscribers[event::class] ?: return
        for (handler in handlers) {
            try {
                handler(event)
            } catch (e: Exception) {
                System.err.println("EventBus dispatch error: \${e.message}")
            }
        }
    }
}`,
    `class RequestRateLimiter(
    private val maxRequests: Int,
    private val windowDurationMs: Long
) {
    private val requestTimestamps = ArrayDeque<Long>()

    @Synchronized
    fun allowRequest(): Boolean {
        val now = System.currentTimeMillis()
        val windowStart = now - windowDurationMs

        while (requestTimestamps.isNotEmpty() && requestTimestamps.first() < windowStart) {
            requestTimestamps.removeFirst()
        }

        return if (requestTimestamps.size < maxRequests) {
            requestTimestamps.addLast(now)
            true
        } else {
            false
        }
    }
}`,
  ],
};
