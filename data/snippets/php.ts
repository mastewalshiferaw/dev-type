import type { SnippetSet } from './types';

export const php: SnippetSet = {
  short: [
    `function slugify(string $text): string {
    $clean = preg_replace('/[^a-zA-Z0-9\\s]/', '', $text);
    return strtolower(trim(preg_replace('/\\s+/', '-', (string) $clean), '-'));
}`,
    `$activeUsers = array_filter($users, fn(array $u): bool => $u['status'] === 'active');
$names = array_column($activeUsers, 'name');
echo implode(', ', $names);`,
    `function parseConfig(string $path): array {
    if (!file_exists($path)) {
        throw new InvalidArgumentException("Missing config file: {$path}");
    }
    return json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
}`,
    `final readonly class UserDto {
    public function __construct(
        public string $id,
        public string $email,
        public int $wpm = 0,
        public bool $verified = false,
    ) {}
}`,
    `$formatted = array_map(
    fn(array $row): array => [
        'id' => (int) $row['id'],
        'title' => htmlspecialchars($row['title'], ENT_QUOTES, 'UTF-8'),
    ],
    $databaseRows
);`,
    `function getHeader(array $headers, string $name, ?string $default = null): ?string {
    $normalized = strtolower($name);
    return $headers[$normalized] ?? $default;
}`,
  ],
  medium: [
    `function findUser(PDO $db, int $id): ?array {
    $stmt = $db->prepare('SELECT id, name, email, role FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: null;
}

function updateUserStatus(PDO $db, int $id, string $status): bool {
    $stmt = $db->prepare('UPDATE users SET status = :status, updated_at = NOW() WHERE id = :id');
    return $stmt->execute([':id' => $id, ':status' => $status]);
}`,
    `enum HttpStatus: int {
    case Ok = 200;
    case Created = 201;
    case BadRequest = 400;
    case Unauthorized = 401;
    case NotFound = 404;
    case ServerError = 500;

    public function message(): string {
        return match ($this) {
            self::Ok => 'Success',
            self::Created => 'Resource Created',
            self::BadRequest => 'Invalid Request',
            self::Unauthorized => 'Access Denied',
            self::NotFound => 'Not Found',
            self::ServerError => 'Internal Error',
        };
    }
}`,
    `function sendJsonResponse(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'timestamp' => time(),
        'success' => $status >= 200 && $status < 300,
        'data' => $payload,
    ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    exit;
}`,
    `final readonly class PaginationResult {
    public int $totalPages;

    public function __construct(
        public array $items,
        public int $totalItems,
        public int $currentPage,
        public int $perPage = 20
    ) {
        $this->totalPages = (int) ceil($this->totalItems / max(1, $this->perPage));
    }

    public function hasNext(): bool {
        return $this->currentPage < $this->totalPages;
    }
}`,
    `function retryOperation(callable $operation, int $maxAttempts = 3, int $delayMs = 200): mixed {
    for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
        try {
            return $operation();
        } catch (Throwable $e) {
            if ($attempt === $maxAttempts) {
                throw $e;
            }
            usleep($delayMs * 1000 * $attempt);
        }
    }
    throw new RuntimeException('Retry execution failed');
}`,
    `function generateCsrfToken(): string {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    $token = bin2hex(random_bytes(32));
    $_SESSION['_csrf_token'] = $token;
    return $token;
}`,
  ],
  long: [
    `final class ShoppingCart {
    private array $items = [];

    public function addItem(string $productId, int $quantity, float $unitPrice): void {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Quantity must be greater than zero');
        }
        if (isset($this->items[$productId])) {
            $this->items[$productId]['quantity'] += $quantity;
        } else {
            $this->items[$productId] = [
                'price' => $unitPrice,
                'quantity' => $quantity,
            ];
        }
    }

    public function removeItem(string $productId): void {
        unset($this->items[$productId]);
    }

    public function calculateSubtotal(): float {
        $sum = 0.0;
        foreach ($this->items as $item) {
            $sum += $item['price'] * $item['quantity'];
        }
        return round($sum, 2);
    }

    public function calculateTotalWithTax(float $taxRate): float {
        $subtotal = $this->calculateSubtotal();
        return round($subtotal * (1.0 + $taxRate), 2);
    }
}`,
    `class RequestValidator {
    private array $errors = [];

    public function __construct(private readonly array $data) {}

    public function require(string $field): self {
        if (!isset($this->data[$field]) || trim((string) $this->data[$field]) === '') {
            $this->errors[$field][] = "Field '{$field}' is required.";
        }
        return $this;
    }

    public function email(string $field): self {
        $val = $this->data[$field] ?? '';
        if ($val !== '' && !filter_var($val, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "Field '{$field}' must be a valid email.";
        }
        return $this;
    }

    public function minLength(string $field, int $min): self {
        $val = (string) ($this->data[$field] ?? '');
        if (strlen($val) < $min) {
            $this->errors[$field][] = "Field '{$field}' must have at least {$min} characters.";
        }
        return $this;
    }

    public function isValid(): bool {
        return empty($this->errors);
    }

    public function getErrors(): array {
        return $this->errors;
    }
}`,
    `class RateLimiter {
    public function __construct(
        private Redis $redis,
        private int $maxAttempts = 60,
        private int $decaySeconds = 60
    ) {}

    public function tooManyAttempts(string $key): bool {
        $current = (int) $this->redis->get($key);
        return $current >= $this->maxAttempts;
    }

    public function hit(string $key): int {
        $pipe = $this->redis->multi();
        $pipe->incr($key);
        $pipe->expire($key, $this->decaySeconds);
        $results = $pipe->exec();
        return (int) ($results[0] ?? 1);
    }

    public function availableIn(string $key): int {
        $ttl = $this->redis->ttl($key);
        return max(0, $ttl);
    }

    public function resetAttempts(string $key): void {
        $this->redis->del($key);
    }
}`,
    `final class EventDispatcher {
    /** @var array<string, list<callable>> */
    private array $listeners = [];

    public function subscribe(string $eventName, callable $listener): void {
        $this->listeners[$eventName][] = $listener;
    }

    public function dispatch(object $event): object {
        $eventName = $event::class;
        if (!isset($this->listeners[$eventName])) {
            return $event;
        }

        foreach ($this->listeners[$eventName] as $listener) {
            $listener($event);
        }

        return $event;
    }
}`,
    `final class DatabaseTransactionManager {
    public function __construct(private readonly PDO $pdo) {}

    public function transactional(callable $callback): mixed {
        $this->pdo->beginTransaction();
        try {
            $result = $callback($this->pdo);
            $this->pdo->commit();
            return $result;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }
}`,
    `final class SimpleRouter {
    private array $routes = [];

    public function get(string $path, callable $handler): void {
        $this->routes['GET'][$path] = $handler;
    }

    public function post(string $path, callable $handler): void {
        $this->routes['POST'][$path] = $handler;
    }

    public function dispatch(string $method, string $uri): mixed {
        $handler = $this->routes[$method][$uri] ?? null;
        if (!$handler) {
            http_response_code(404);
            return 'Not Found';
        }
        return $handler();
    }
}`,
  ],
};
