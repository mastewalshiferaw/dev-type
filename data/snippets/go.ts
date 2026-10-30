import type { SnippetSet } from './types';

export const go: SnippetSet = {
  short: [
    `func add(a, b int) int {
	return a + b
}`,
    `names := []string{"ada", "linus", "grace"}
fmt.Println(len(names))`,
  ],
  medium: [
    `func readConfig(path string) ([]byte, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}
	return data, nil
}`,
    `// Sum adds every value in the slice
func Sum[T int | float64](values []T) T {
	var total T
	for _, v := range values {
		total += v
	}
	return total
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
		w.WriteHeader(http.StatusOK) // always healthy for now
	})
	return s
}

func (s *Server) Run() error {
	return http.ListenAndServe(s.addr, s.mux)
}`,
  ],
};
