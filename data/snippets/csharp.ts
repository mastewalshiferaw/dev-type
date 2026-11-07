import type { SnippetSet } from './types';

export const csharp: SnippetSet = {
  short: [
    `public static string FormatScore(string username, double wpm, double acc) =>
    $"{username}: {wpm:F1} WPM ({acc:F1}% accuracy)";`,
    `public record UserProfile(string Id, string Username, string Email)
{
    public bool IsAdmin => Email.EndsWith("@company.com", StringComparison.OrdinalIgnoreCase);
}`,
    `public static double CalculateAccuracy(int correctChars, int totalChars)
{
    if (totalChars <= 0) return 100.0;
    return Math.Clamp((double)correctChars / totalChars * 100.0, 0.0, 100.0);
}`,
    `var topScorers = players
    .Where(p => p.IsActive && p.Accuracy >= 95.0)
    .OrderByDescending(p => p.Wpm)
    .Take(10)
    .Select(p => (p.Username, p.Wpm));`,
    `public static string CategorizeSpeed(int wpm) => wpm switch
{
    >= 140 => "Grandmaster",
    >= 100 => "Expert",
    >= 70 => "Proficient",
    >= 40 => "Intermediate",
    _ => "Novice"
};`,
    `using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
var response = await httpClient.GetFromJsonAsync<ApiResponse>(endpoint, cts.Token);`,
  ],
  medium: [
    `public class ExponentialBackoffRetry
{
    public static async Task<T> ExecuteAsync<T>(
        Func<Task<T>> operation,
        int maxRetries = 3,
        int initialDelayMs = 200)
    {
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await operation();
            }
            catch when (attempt < maxRetries)
            {
                int delay = initialDelayMs * (int)Math.Pow(2, attempt - 1);
                await Task.Delay(delay);
            }
        }
        return await operation();
    }
}`,
    `public readonly struct Result<T, TError>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public TError? Error { get; }

    private Result(T value) => (IsSuccess, Value, Error) = (true, value, default);
    private Result(TError error) => (IsSuccess, Value, Error) = (false, default, error);

    public static Result<T, TError> Ok(T value) => new(value);
    public static Result<T, TError> Fail(TError error) => new(error);

    public TResult Match<TResult>(Func<T, TResult> onSuccess, Func<TError, TResult> onError) =>
        IsSuccess ? onSuccess(Value!) : onError(Error!);
}`,
    `public class BoundedChannelQueue<T>
{
    private readonly Channel<T> _channel;

    public BoundedChannelQueue(int capacity)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _channel = Channel.CreateBounded<T>(options);
    }

    public ValueTask EnqueueAsync(T item, CancellationToken ct = default) =>
        _channel.Writer.WriteAsync(item, ct);

    public IAsyncEnumerable<T> ReadAllAsync(CancellationToken ct = default) =>
        _channel.Reader.ReadAllAsync(ct);
}`,
    `public static string TruncateWithEllipsis(ReadOnlySpan<char> text, int maxLength)
{
    if (text.Length <= maxLength)
    {
        return text.ToString();
    }
    return string.Concat(text[..(maxLength - 3)], "...");
}`,
    `public class MemoryCache<TKey, TValue> where TKey : notnull
{
    private readonly ConcurrentDictionary<TKey, (TValue Value, DateTime ExpiresAt)> _cache = new();

    public void Set(TKey key, TValue value, TimeSpan duration)
    {
        _cache[key] = (value, DateTime.UtcNow.Add(duration));
    }

    public bool TryGet(TKey key, out TValue? value)
    {
        if (_cache.TryGetValue(key, out var entry) && entry.ExpiresAt > DateTime.UtcNow)
        {
            value = entry.Value;
            return true;
        }
        value = default;
        return false;
    }
}`,
    `public class RateLimiter
{
    private readonly SemaphoreSlim _semaphore;
    private readonly TimeSpan _interval;

    public RateLimiter(int maxConcurrent, TimeSpan interval)
    {
        _semaphore = new SemaphoreSlim(maxConcurrent, maxConcurrent);
        _interval = interval;
    }

    public async Task<T> ExecuteAsync<T>(Func<Task<T>> action)
    {
        await _semaphore.WaitAsync();
        try
        {
            return await action();
        }
        finally
        {
            _ = Task.Delay(_interval).ContinueWith(_ => _semaphore.Release());
        }
    }
}`,
  ],
  long: [
    `public class LruCache<TKey, TValue> where TKey : notnull
{
    private readonly int _capacity;
    private readonly Dictionary<TKey, LinkedListNode<CacheItem>> _map;
    private readonly LinkedList<CacheItem> _list;

    private record CacheItem(TKey Key, TValue Value);

    public LruCache(int capacity)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(capacity);
        _capacity = capacity;
        _map = new Dictionary<TKey, LinkedListNode<CacheItem>>(capacity);
        _list = new LinkedList<CacheItem>();
    }

    public bool TryGet(TKey key, out TValue? value)
    {
        if (_map.TryGetValue(key, out var node))
        {
            _list.Remove(node);
            _list.AddFirst(node);
            value = node.Value.Value;
            return true;
        }
        value = default;
        return false;
    }

    public void Put(TKey key, TValue value)
    {
        if (_map.TryGetValue(key, out var node))
        {
            _list.Remove(node);
            _list.AddFirst(node);
            node.Value = new CacheItem(key, value);
            return;
        }

        if (_map.Count >= _capacity)
        {
            var lru = _list.Last!;
            _map.Remove(lru.Value.Key);
            _list.RemoveLast();
        }

        var newNode = _list.AddFirst(new CacheItem(key, value));
        _map[key] = newNode;
    }
}`,
    `public class MetricsCollector
{
    private readonly List<double> _samples = [];
    private readonly Lock _lock = new();

    public void RecordSample(double value)
    {
        lock (_lock)
        {
            _samples.Add(value);
        }
    }

    public (double Mean, double P95, double P99) ComputeStatistics()
    {
        lock (_lock)
        {
            if (_samples.Count == 0) return (0, 0, 0);

            var sorted = _samples.Order().ToList();
            double mean = sorted.Average();

            int p95Index = (int)Math.Ceiling(sorted.Count * 0.95) - 1;
            int p99Index = (int)Math.Ceiling(sorted.Count * 0.99) - 1;

            return (
                mean,
                sorted[Math.Clamp(p95Index, 0, sorted.Count - 1)],
                sorted[Math.Clamp(p99Index, 0, sorted.Count - 1)]
            );
        }
    }
}`,
    `public interface ICommandHandler<in TCommand, TResult>
{
    Task<TResult> HandleAsync(TCommand command, CancellationToken ct);
}

public class CommandDispatcher
{
    private readonly IServiceProvider _serviceProvider;

    public CommandDispatcher(IServiceProvider serviceProvider) =>
        _serviceProvider = serviceProvider;

    public async Task<TResult> DispatchAsync<TCommand, TResult>(
        TCommand command,
        CancellationToken ct = default)
    {
        var handler = _serviceProvider.GetService(typeof(ICommandHandler<TCommand, TResult>))
            as ICommandHandler<TCommand, TResult>;

        if (handler == null)
        {
            throw new InvalidOperationException($"No handler registered for {typeof(TCommand).Name}");
        }

        return await handler.HandleAsync(command, ct);
    }
}`,
    `public class TokenBucket
{
    private readonly double _capacity;
    private readonly double _refillRatePerSec;
    private double _tokens;
    private DateTime _lastRefillUtc;
    private readonly object _sync = new();

    public TokenBucket(double capacity, double refillRatePerSec)
    {
        _capacity = capacity;
        _refillRatePerSec = refillRatePerSec;
        _tokens = capacity;
        _lastRefillUtc = DateTime.UtcNow;
    }

    public bool TryConsume(double amount = 1.0)
    {
        lock (_sync)
        {
            var now = DateTime.UtcNow;
            double elapsedSeconds = (now - _lastRefillUtc).TotalSeconds;
            _tokens = Math.Min(_capacity, _tokens + elapsedSeconds * _refillRatePerSec);
            _lastRefillUtc = now;

            if (_tokens >= amount)
            {
                _tokens -= amount;
                return true;
            }
            return false;
        }
    }
}`,
    `public sealed class EventHub<TEvent>
{
    private readonly List<Func<TEvent, Task>> _handlers = [];
    private readonly ReaderWriterLockSlim _rwLock = new();

    public IDisposable Subscribe(Func<TEvent, Task> handler)
    {
        _rwLock.EnterWriteLock();
        try { _handlers.Add(handler); }
        finally { _rwLock.ExitWriteLock(); }

        return new Subscription(() =>
        {
            _rwLock.EnterWriteLock();
            try { _handlers.Remove(handler); }
            finally { _rwLock.ExitWriteLock(); }
        });
    }

    public async Task PublishAsync(TEvent evt)
    {
        List<Func<TEvent, Task>> snapshot;
        _rwLock.EnterReadLock();
        try { snapshot = [.. _handlers]; }
        finally { _rwLock.ExitReadLock(); }

        await Task.WhenAll(snapshot.Select(h => h(evt)));
    }

    private sealed record Subscription(Action DisposeAction) : IDisposable
    {
        public void Dispose() => DisposeAction();
    }
}`,
    `public class BinaryMinHeap<T> where T : IComparable<T>
{
    private readonly List<T> _items = [];

    public int Count => _items.Count;

    public void Push(T item)
    {
        _items.Add(item);
        int i = _items.Count - 1;
        while (i > 0)
        {
            int p = (i - 1) / 2;
            if (_items[i].CompareTo(_items[p]) >= 0) break;
            (_items[i], _items[p]) = (_items[p], _items[i]);
            i = p;
        }
    }

    public T Pop()
    {
        if (_items.Count == 0) throw new InvalidOperationException("Heap is empty");
        T root = _items[0];
        T last = _items[^1];
        _items.RemoveAt(_items.Count - 1);
        if (_items.Count > 0)
        {
            _items[0] = last;
            Heapify(0);
        }
        return root;
    }

    private void Heapify(int i)
    {
        while (true)
        {
            int smallest = i;
            int l = 2 * i + 1, r = 2 * i + 2;
            if (l < _items.Count && _items[l].CompareTo(_items[smallest]) < 0) smallest = l;
            if (r < _items.Count && _items[r].CompareTo(_items[smallest]) < 0) smallest = r;
            if (smallest == i) break;
            (_items[i], _items[smallest]) = (_items[smallest], _items[i]);
            i = smallest;
        }
    }
}`,
  ],
};
