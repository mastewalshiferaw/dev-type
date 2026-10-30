import type { SnippetSet } from './types';

export const java: SnippetSet = {
  short: [
    `public static int max(int a, int b) {
    return a > b ? a : b;
}`,
    `List<String> langs = List.of("Java", "Kotlin", "Scala");
langs.forEach(System.out::println);`,
  ],
  medium: [
    `public record Point(int x, int y) {
    public double distanceTo(Point other) {
        int dx = x - other.x();
        int dy = y - other.y();
        return Math.sqrt(dx * dx + dy * dy);
    }
}`,
    `// Count how often each word appears
Map<String, Long> counts = words.stream()
    .map(String::toLowerCase)
    .collect(Collectors.groupingBy(w -> w, Collectors.counting()));`,
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

    public long getBalance() {
        return balance;
    }
}`,
    `public static String readFirstLine(Path path) throws IOException {
    /* try-with-resources closes the reader for us */
    try (BufferedReader reader = Files.newBufferedReader(path)) {
        String line = reader.readLine();
        return line == null ? "" : line.trim();
    }
}

public static void main(String[] args) throws IOException {
    System.out.println(readFirstLine(Path.of("README.md")));
}`,
  ],
};
