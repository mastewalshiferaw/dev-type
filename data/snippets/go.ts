import type { SnippetSet } from './types';

export const go: SnippetSet = {
  short: [
    `ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

res, err := client.Do(req.WithContext(ctx))
if err != nil {
  return fmt.Errorf("http request failed: %w", err)
}`,
    `type Set[T comparable] map[T]struct{}

func NewSet[T comparable](items ...T) Set[T] {
  s := make(Set[T], len(items))
  for _, item := range items {
    s[item] = struct{}{}
  }
  return s
}`,
    `func getEnv(key, fallback string) string {
  if val, exists := os.LookupEnv(key); exists && val != "" {
    return val
  }
  return fallback
}`,
    `func writeJSON(w http.ResponseWriter, status int, data any) {
  w.Header().Set("Content-Type", "application/json")
  w.WriteHeader(status)
  _ = json.NewEncoder(w).Encode(data)
}`,
    `func Filter[T any](items []T, predicate func(T) bool) []T {
  out := make([]T, 0, len(items))
  for _, v := range items {
    if predicate(v) {
      out = append(out, v)
    }
  }
  return out
}`,
    `type AtomicMetric struct {
  keystrokes atomic.Int64
  errors     atomic.Int64
}

func (m *AtomicMetric) RecordKeystroke(err bool) {
  m.keystrokes.Add(1)
  if err {
    m.errors.Add(1)
  }
}`,
  ],
  medium: [
    `func RetryWithBackoff(ctx context.Context, attempts int, fn func() error) error {
  var err error
  backoff := 100 * time.Millisecond

  for i := 0; i < attempts; i++ {
    if err = fn(); err == nil {
      return nil
    }
    select {
    case <-ctx.Done():
      return ctx.Err()
    case <-time.After(backoff):
      backoff *= 2
    }
  }
  return fmt.Errorf("failed after %d attempts: %w", attempts, err)
}`,
    `func LoggingMiddleware(logger *log.Logger) func(http.Handler) http.Handler {
  return func(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
      start := time.Now()
      next.ServeHTTP(w, r)
      logger.Printf("%s %s completed in %v", r.Method, r.URL.Path, time.Since(start))
    })
  }
}`,
    `type CacheEntry struct {
  value     any
  expiresAt time.Time
}

type MemoryCache struct {
  mu    sync.RWMutex
  items map[string]CacheEntry
}

func (c *MemoryCache) Get(key string) (any, bool) {
  c.mu.RLock()
  defer c.mu.RUnlock()
  entry, ok := c.items[key]
  if !ok || time.Now().After(entry.expiresAt) {
    return nil, false
  }
  return entry.value, true
}`,
    `func ParallelMap[T, R any](items []T, workerFn func(T) R) []R {
  results := make([]R, len(items))
  var wg sync.WaitGroup

  for i, item := range items {
    wg.Add(1)
    go func(idx int, val T) {
      defer wg.Done()
      results[idx] = workerFn(val)
    }(i, item)
  }

  wg.Wait()
  return results
}`,
    `type UserProfile struct {
  ID        string    \`json:"id"\`
  Username  string    \`json:"username"\`
  Email     string    \`json:"email"\`
  WPM       float64   \`json:"wpm"\`
  CreatedAt time.Time \`json:"created_at"\`
}

func (u *UserProfile) Validate() error {
  if u.Username == "" {
    return errors.New("username cannot be empty")
  }
  if !strings.Contains(u.Email, "@") {
    return errors.New("invalid email address")
  }
  return nil
}`,
    `func StreamPipeline(ctx context.Context, in <-chan int) <-chan int {
  out := make(chan int)
  go func() {
    defer close(out)
    for {
      select {
      case <-ctx.Done():
        return
      case val, ok := <-in:
        if !ok {
          return
        }
        out <- val * 2
      }
    }
  }()
  return out
}`,
  ],
  long: [
    `type GracefulServer struct {
  server *http.Server
  logger *log.Logger
}

func NewGracefulServer(addr string, handler http.Handler) *GracefulServer {
  return &GracefulServer{
    server: &http.Server{
      Addr:         addr,
      Handler:      handler,
      ReadTimeout:  10 * time.Second,
      WriteTimeout: 10 * time.Second,
    },
    logger: log.Default(),
  }
}

func (s *GracefulServer) Start() error {
  stop := make(chan os.Signal, 1)
  signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

  go func() {
    s.logger.Printf("Server listening on %s", s.server.Addr)
    if err := s.server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
      s.logger.Fatalf("Server error: %v", err)
    }
  }()

  <-stop
  s.logger.Println("Shutting down server gracefully...")

  ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
  defer cancel()
  return s.server.Shutdown(ctx)
}`,
    `type Job[T, R any] struct {
  ID   int
  Data T
}

type Result[R any] struct {
  JobID  int
  Output R
  Err    error
}

func WorkerPool[T, R any](workers int, jobs <-chan Job[T, R], processFn func(T) (R, error)) <-chan Result[R] {
  results := make(chan Result[R])
  var wg sync.WaitGroup

  for w := 0; w < workers; w++ {
    wg.Add(1)
    go func() {
      defer wg.Done()
      for job := range jobs {
        out, err := processFn(job.Data)
        results <- Result[R]{JobID: job.ID, Output: out, Err: err}
      }
    }()
  }

  go func() {
    wg.Wait()
    close(results)
  }()

  return results
}`,
    `type RateLimiter struct {
  mu         sync.Mutex
  capacity   float64
  tokens     float64
  refillRate float64
  lastRefill time.Time
}

func NewRateLimiter(rate, burst float64) *RateLimiter {
  return &RateLimiter{
    capacity:   burst,
    tokens:     burst,
    refillRate: rate,
    lastRefill: time.Now(),
  }
}

func (r *RateLimiter) Allow() bool {
  r.mu.Lock()
  defer r.mu.Unlock()

  now := time.Now()
  elapsed := now.Sub(r.lastRefill).Seconds()
  r.tokens += elapsed * r.refillRate
  if r.tokens > r.capacity {
    r.tokens = r.capacity
  }
  r.lastRefill = now

  if r.tokens >= 1.0 {
    r.tokens -= 1.0
    return true
  }
  return false
}`,
    `type Node[K comparable, V any] struct {
  key   K
  value V
  prev  *Node[K, V]
  next  *Node[K, V]
}

type LRU[K comparable, V any] struct {
  capacity int
  items    map[K]*Node[K, V]
  head     *Node[K, V]
  tail     *Node[K, V]
}

func NewLRU[K comparable, V any](capacity int) *LRU[K, V] {
  head := &Node[K, V]{}
  tail := &Node[K, V]{}
  head.next = tail
  tail.prev = head
  return &LRU[K, V]{
    capacity: capacity,
    items:    make(map[K]*Node[K, V]),
    head:     head,
    tail:     tail,
  }
}

func (l *LRU[K, V]) remove(node *Node[K, V]) {
  node.prev.next = node.next
  node.next.prev = node.prev
}

func (l *LRU[K, V]) pushFront(node *Node[K, V]) {
  node.next = l.head.next
  node.prev = l.head
  l.head.next.prev = node
  l.head.next = node
}`,
    `type MessageQueue struct {
  mu      sync.Mutex
  cond    *sync.Cond
  queue   []string
  closed  bool
}

func NewMessageQueue() *MessageQueue {
  mq := &MessageQueue{}
  mq.cond = sync.NewCond(&mq.mu)
  return mq
}

func (mq *MessageQueue) Push(msg string) {
  mq.mu.Lock()
  defer mq.mu.Unlock()
  if mq.closed {
    return
  }
  mq.queue = append(mq.queue, msg)
  mq.cond.Signal()
}

func (mq *MessageQueue) Pop() (string, bool) {
  mq.mu.Lock()
  defer mq.mu.Unlock()
  for len(mq.queue) == 0 && !mq.closed {
    mq.cond.Wait()
  }
  if len(mq.queue) == 0 {
    return "", false
  }
  msg := mq.queue[0]
  mq.queue = mq.queue[1:]
  return msg, true
}`,
    `type RouteEntry struct {
  pattern *regexp.Regexp
  handler http.HandlerFunc
}

type RegexRouter struct {
  routes []RouteEntry
}

func (r *RegexRouter) Handle(pattern string, handler http.HandlerFunc) {
  re := regexp.MustCompile("^" + pattern + "$")
  r.routes = append(r.routes, RouteEntry{pattern: re, handler: handler})
}

func (r *RegexRouter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
  path := req.URL.Path
  for _, route := range r.routes {
    if route.pattern.MatchString(path) {
      route.handler(w, req)
      return
    }
  }
  http.NotFound(w, req)
}`,
    `type JobResult struct {
  ID    int
  Value string
  Err   error
}

func WorkerPool(ctx context.Context, numWorkers int, jobs <-chan int) <-chan JobResult {
  results := make(chan JobResult)
  var wg sync.WaitGroup

  for w := 0; w < numWorkers; w++ {
    wg.Add(1)
    go func(workerID int) {
      defer wg.Done()
      for {
        select {
        case <-ctx.Done():
          return
        case id, ok := <-jobs:
          if !ok {
            return
          }
          results <- JobResult{ID: id, Value: fmt.Sprintf("worker-%d-processed", workerID)}
        }
      }
    }(w)
  }

  go func() {
    wg.Wait()
    close(results)
  }()

  return results
}`,
    `func MergeChannels[T any](ctx context.Context, cs ...<-chan T) <-chan T {
  out := make(chan T)
  var wg sync.WaitGroup

  output := func(c <-chan T) {
    defer wg.Done()
    for n := range c {
      select {
      case out <- n:
      case <-ctx.Done():
        return
      }
    }
  }

  wg.Add(len(cs))
  for _, c := range cs {
    go output(c)
  }

  go func() {
    wg.Wait()
    close(out)
  }()
  return out
}`,
  ],
};
