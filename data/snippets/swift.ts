import type { SnippetSet } from './types';

export const swift: SnippetSet = {
  short: [
    `let scores = [72, 98, 85]
let best = scores.max() ?? 0`,
    `func square(_ x: Int) -> Int {
    x * x
}`,
  ],
  medium: [
    `struct Temperature {
    var celsius: Double

    var fahrenheit: Double {
        celsius * 9 / 5 + 32
    }
}`,
    `// Load a user, or nil if the request fails
func loadUser(id: Int) async -> User? {
    let url = URL(string: "https://api.example.com/users/\\(id)")!
    guard let (data, _) = try? await URLSession.shared.data(from: url) else { return nil }
    return try? JSONDecoder().decode(User.self, from: data)
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
  ],
};
