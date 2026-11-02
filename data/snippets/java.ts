import type { SnippetSet } from './types';

export const java: SnippetSet = {
  short: [
    `public static int max(int a, int b) {
    return a > b ? a : b;
}`,
    `List<String> langs = List.of("Java", "Kotlin", "Scala");
langs.forEach(System.out::println);`,
    `public static boolean isBlank(String str) {
    return str == null || str.trim().isEmpty();
}`,
  ],
  medium: [
    `public record Point(int x, int y) {
    public double distanceTo(Point other) {
        int dx = x - other.x();
        int dy = y - other.y();
        return Math.sqrt(dx * dx + dy * dy);
    }
}`,
    `Map<String, Long> counts = words.stream()
    .map(String::toLowerCase)
    .collect(Collectors.groupingBy(w -> w, Collectors.counting()));`,
    `public static <T> List<T> reverseList(List<T> list) {
    List<T> reversed = new ArrayList<>(list);
    Collections.reverse(reversed);
    return Collections.unmodifiableList(reversed);
}`,
  ],
  long: [
    `public class BankAccount {
    private final String owner;
    private long balance;

    public BankAccount(String owner) {
        this.owner = owner;
    }

    public void deposit(long amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        balance += amount;
    }

    public void withdraw(long amount) {
        if (amount > balance) {
            throw new IllegalStateException("Insufficient funds");
        }
        balance -= amount;
    }

    public long getBalance() {
        return balance;
    }
}`,
    `public static String readFirstLine(Path path) throws IOException {
    try (BufferedReader reader = Files.newBufferedReader(path)) {
        String line = reader.readLine();
        return line == null ? "" : line.trim();
    }
}

public static void main(String[] args) throws IOException {
    System.out.println(readFirstLine(Path.of("README.md")));
}`,
    `public final class CacheService<K, V> {
    private final Map<K, V> storage = new ConcurrentHashMap<>();

    public Optional<V> find(K key) {
        return Optional.ofNullable(storage.get(key));
    }

    public void put(K key, V value) {
        storage.put(Objects.requireNonNull(key), Objects.requireNonNull(value));
    }

    public void invalidate(K key) {
        storage.remove(key);
    }
}`,
  ],
};
