import type { SnippetSet } from './types';

export const cpp: SnippetSet = {
  short: [
    `std::string_view strip_prefix(std::string_view text, std::string_view prefix) {
    if (text.starts_with(prefix)) {
        return text.substr(prefix.size());
    }
    return text;
}`,
    `template <typename T>
concept Numeric = std::is_arithmetic_v<T>;

template <Numeric T>
T lerp(T start, T end, double t) {
    return static_cast<T>(start + t * (end - start));
}`,
    `std::optional<int> parse_port(std::string_view str) {
    int port = 0;
    auto [ptr, ec] = std::from_chars(str.data(), str.data() + str.size(), port);
    if (ec == std::errc{} && port > 0 && port <= 65535) {
        return port;
    }
    return std::nullopt;
}`,
    `std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8};
auto evens = numbers
    | std::views::filter([](int n) { return n % 2 == 0; })
    | std::views::transform([](int n) { return n * n; });`,
    `std::scoped_lock lock(mutex_a, mutex_b);
account_a.balance -= amount;
account_b.balance += amount;`,
    `const auto [iter, inserted] = cache.emplace(key, expensive_compute());
if (!inserted) {
    iter->second = updated_value;
}`,
  ],
  medium: [
    `template <typename T, std::size_t Capacity>
class CircularBuffer {
private:
    std::array<T, Capacity> buffer_{};
    std::size_t head_ = 0;
    std::size_t tail_ = 0;
    std::size_t size_ = 0;

public:
    bool push(const T& item) {
        if (size_ == Capacity) return false;
        buffer_[tail_] = item;
        tail_ = (tail_ + 1) % Capacity;
        ++size_;
        return true;
    }

    std::optional<T> pop() {
        if (size_ == 0) return std::nullopt;
        T item = buffer_[head_];
        head_ = (head_ + 1) % Capacity;
        --size_;
        return item;
    }
};`,
    `std::vector<std::string_view> split_string(std::string_view str, char delimiter) {
    std::vector<std::string_view> tokens;
    std::size_t start = 0;
    std::size_t end = str.find(delimiter);

    while (end != std::string_view::npos) {
        tokens.emplace_back(str.substr(start, end - start));
        start = end + 1;
        end = str.find(delimiter, start);
    }
    tokens.emplace_back(str.substr(start));
    return tokens;
}`,
    `template <typename T>
int binary_search(const std::vector<T>& arr, const T& target) {
    int left = 0;
    int right = static_cast<int>(arr.size()) - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    return -1;
}`,
    `class DatabaseConnectionPool {
private:
    DatabaseConnectionPool() = default;

public:
    DatabaseConnectionPool(const DatabaseConnectionPool&) = delete;
    DatabaseConnectionPool& operator=(const DatabaseConnectionPool&) = delete;

    static DatabaseConnectionPool& instance() {
        static DatabaseConnectionPool instance_;
        return instance_;
    }

    void execute(std::string_view query) {
        std::println("Executing SQL: {}", query);
    }
};`,
    `struct Token {
    enum class Type { Identifier, Number, Operator, Eof };
    Type type;
    std::string text;
    int line;
};

std::string_view token_type_name(Token::Type t) {
    switch (t) {
        case Token::Type::Identifier: return "Identifier";
        case Token::Type::Number:     return "Number";
        case Token::Type::Operator:   return "Operator";
        case Token::Type::Eof:        return "EOF";
    }
    return "Unknown";
}`,
    `template <typename T>
class ScopedTimer {
private:
    std::string tag_;
    std::chrono::high_resolution_clock::time_point start_;

public:
    explicit ScopedTimer(std::string tag)
        : tag_(std::move(tag)), start_(std::chrono::high_resolution_clock::now()) {}

    ~ScopedTimer() {
        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start_);
        std::println("[{}] Elapsed: {} us", tag_, duration.count());
    }
};`,
  ],
  long: [
    `#include <queue>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <functional>

class ThreadPool {
private:
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex queue_mutex_;
    std::condition_variable cv_;
    bool stop_ = false;

public:
    explicit ThreadPool(std::size_t threads) {
        for (std::size_t i = 0; i < threads; ++i) {
            workers_.emplace_back([this]() {
                while (true) {
                    std::function<void()> task;
                    {
                        std::unique_lock<std::mutex> lock(queue_mutex_);
                        cv_.wait(lock, [this]() { return stop_ || !tasks_.empty(); });
                        if (stop_ && tasks_.empty()) return;
                        task = std::move(tasks_.front());
                        tasks_.pop();
                    }
                    task();
                }
            });
        }
    }

    void enqueue(std::function<void()> task) {
        {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            tasks_.push(std::move(task));
        }
        cv_.notify_one();
    }

    ~ThreadPool() {
        {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            stop_ = true;
        }
        cv_.notify_all();
        for (std::thread& worker : workers_) {
            if (worker.joinable()) worker.join();
        }
    }
};`,
    `#include <unordered_map>
#include <list>
#include <optional>

template <typename Key, typename Value>
class LRUCache {
private:
    using Pair = std::pair<Key, Value>;
    std::size_t capacity_;
    std::list<Pair> order_;
    std::unordered_map<Key, typename std::list<Pair>::iterator> index_;

public:
    explicit LRUCache(std::size_t capacity) : capacity_(capacity) {}

    std::optional<Value> get(const Key& key) {
        auto it = index_.find(key);
        if (it == index_.end()) return std::nullopt;
        order_.splice(order_.begin(), order_, it->second);
        return it->second->second;
    }

    void put(const Key& key, const Value& value) {
        auto it = index_.find(key);
        if (it != index_.end()) {
            order_.splice(order_.begin(), order_, it->second);
            it->second->second = value;
            return;
        }
        if (order_.size() >= capacity_) {
            const Key& oldest = order_.back().first;
            index_.erase(oldest);
            order_.pop_back();
        }
        order_.emplace_front(key, value);
        index_[key] = order_.begin();
    }
};`,
    `template <typename T>
class SafeQueue {
private:
    mutable std::mutex mutex_;
    std::queue<T> data_;
    std::condition_variable cv_;

public:
    void push(T value) {
        std::lock_guard<std::mutex> lock(mutex_);
        data_.push(std::move(value));
        cv_.notify_one();
    }

    T wait_and_pop() {
        std::unique_lock<std::mutex> lock(mutex_);
        cv_.wait(lock, [this]() { return !data_.empty(); });
        T result = std::move(data_.front());
        data_.pop();
        return result;
    }

    bool empty() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return data_.empty();
    }
};`,
    `class ASTVisitor;

class ASTNode {
public:
    virtual ~ASTNode() = default;
    virtual void accept(ASTVisitor& visitor) const = 0;
};

class LiteralNode : public ASTNode {
public:
    int value;
    explicit LiteralNode(int val) : value(val) {}
    void accept(ASTVisitor& visitor) const override;
};

class BinaryOpNode : public ASTNode {
public:
    char op;
    std::unique_ptr<ASTNode> left;
    std::unique_ptr<ASTNode> right;

    BinaryOpNode(char o, std::unique_ptr<ASTNode> l, std::unique_ptr<ASTNode> r)
        : op(o), left(std::move(l)), right(std::move(r)) {}

    void accept(ASTVisitor& visitor) const override;
};`,
    `template <typename Subject, typename Event>
class Observable {
private:
    std::vector<std::function<void(const Event&)>> observers_;

public:
    void subscribe(std::function<void(const Event&)> observer) {
        observers_.push_back(std::move(observer));
    }

    void notify(const Event& event) const {
        for (const auto& observer : observers_) {
            observer(event);
        }
    }
};

struct TypingEvent {
    std::string key;
    double timestamp_ms;
    bool is_correct;
};`,
    `template <typename T>
class Matrix2D {
private:
    std::size_t rows_;
    std::size_t cols_;
    std::vector<T> data_;

public:
    Matrix2D(std::size_t rows, std::size_t cols, T initial = T{})
        : rows_(rows), cols_(cols), data_(rows * cols, initial) {}

    T& at(std::size_t r, std::size_t c) {
        if (r >= rows_ || c >= cols_) throw std::out_of_range("Matrix bounds exceeded");
        return data_[r * cols_ + c];
    }

    const T& at(std::size_t r, std::size_t c) const {
        if (r >= rows_ || c >= cols_) throw std::out_of_range("Matrix bounds exceeded");
        return data_[r * cols_ + c];
    }

    std::size_t rows() const { return rows_; }
    std::size_t cols() const { return cols_; }
};`,
  ],
};
