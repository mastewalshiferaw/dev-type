import type { SnippetSet } from './types';

export const swift: SnippetSet = {
  short: [
    `let scores = [72, 98, 85]
let best = scores.max() ?? 0
print("Top score: \\(best)")`,
    `func square(_ x: Int) -> Int {
    x * x
}`,
    `let names = ["ada", "grace", "margaret"]
let formatted = names.map { $0.capitalized }.joined(separator: ", ")`,
  ],
  medium: [
    `struct Temperature {
    var celsius: Double

    var fahrenheit: Double {
        celsius * 9 / 5 + 32
    }
}`,
    `func loadUser(id: Int) async -> User? {
    let url = URL(string: "https://api.example.com/users/\\(id)")!
    guard let (data, _) = try? await URLSession.shared.data(from: url) else { return nil }
    return try? JSONDecoder().decode(User.self, from: data)
}`,
    `func compactMapValues<K, V, R>(_ dict: [K: V], transform: (V) -> R?) -> [K: R] {
    var result = [K: R]()
    for (key, val) in dict {
        if let transformed = transform(val) {
            result[key] = transformed
        }
    }
    return result
}`,
  ],
  long: [
    `enum NetworkError: Error {
    case badURL
    case timeout(seconds: Int)
}

func describe(_ error: NetworkError) -> String {
    switch error {
    case .badURL:
        return "The URL is invalid"
    case .timeout(let seconds):
        return "Timed out after \\(seconds)s"
    }
}

print(describe(.timeout(seconds: 30)))`,
    `final class Counter: ObservableObject {
    @Published private(set) var value = 0

    func increment() {
        value += 1
    }

    func reset() {
        value = 0
    }
}

struct CounterView: View {
    @StateObject private var counter = Counter()

    var body: some View {
        Button("Count: \\(counter.value)") { counter.increment() }
    }
}`,
    `struct Debouncer {
    private var task: Task<Void, Never>?

    mutating func debounce(delay: Duration, action: @escaping @Sendable () async -> Void) {
        task?.cancel()
        task = Task {
            try? await Task.sleep(for: delay)
            if !Task.isCancelled {
                await action()
            }
        }
    }
}`,
  ],
};
