import type { SnippetSet } from './types';

export const go: SnippetSet = {
  short: [
    `func add(a, b int) int {
	return a + b
}`,
    `names := []string{"ada", "linus", "grace"}
for i, name := range names {
	fmt.Printf("%d: %s\\n", i, name)
}`,
    `type Point struct {
	X, Y float64
}

func (p Point) IsZero() bool {
	return p.X == 0 && p.Y == 0
}`,
  ],
  medium: [
    `func readConfig(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}
	return data, nil
}`,
    `func Sum[T int | float64](values []T) T {
	var total T
	for _, v := range values {
		total += v
	}
	return total
}`,
    `func Map[T, U any](ts []T, fn func(T) U) []U {
	us := make([]U, len(ts))
	for i, t := range ts {
		us[i] = fn(t)
	}
	return us
}`,
  ],
  long: [
    `func worker(id int, jobs <-chan int, results chan<- int) {
	for job := range jobs {
		results <- job * 2
	}
}

func main() {
	jobs := make(chan int, 10)
	results := make(chan int, 10)
	for w := 1; w <= 3; w++ {
		go worker(w, jobs, results)
	}
	for j := 1; j <= 5; j++ {
		jobs <- j
	}
	close(jobs)
}`,
    `type Server struct {
	mux  *http.ServeMux
	addr string
}

func NewServer(addr string) *Server {
	s := &Server{mux: http.NewServeMux(), addr: addr}
	s.mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	return s
}

func (s *Server) Run() error {
	return http.ListenAndServe(s.addr, s.mux)
}`,
    `type SafeCounter struct {
	mu sync.Mutex
	v  map[string]int
}

func (c *SafeCounter) Inc(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.v[key]++
}

func (c *SafeCounter) Value(key string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.v[key]
}`,
  ],
};
