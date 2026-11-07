import type { SnippetSet } from './types';

export const swift: SnippetSet = {
  short: [
    `func calculateMetrics(charsTyped: Int, errors: Int, elapsedSec: Double) -> (wpm: Double, accuracy: Double) {
    guard elapsedSec > 0 else { return (0.0, 100.0) }
    let netWords = max(0.0, Double(charsTyped) / 5.0 - Double(errors))
    let wpm = (netWords / (elapsedSec / 60.0)).rounded()
    let accuracy = charsTyped > 0 ? (Double(charsTyped - errors) / Double(charsTyped) * 100.0) : 100.0
    return (wpm, min(100.0, max(0.0, accuracy)))
}`,
    `struct UserProfile: Codable, Identifiable, Hashable {
    let id: UUID
    let username: String
    let email: String
    var bestWpm: Double
}`,
    `let highScorers = leaderboard
    .filter { $0.accuracy >= 95.0 && $0.verified }
    .sorted(by: { $0.wpm > $1.wpm })
    .prefix(10)
    .map(\\.username)`,
    `enum TypingStatus: Equatable {
    case idle
    case inProgress(wpm: Double)
    case completed(wpm: Double, accuracy: Double)
    case forfeited
}`,
    `func clamp<T: Comparable>(_ value: T, min: T, max: T) -> T {
    Swift.max(min, Swift.min(value, max))
}`,
    `guard let url = URL(string: endpoint), url.scheme == "https" else {
    throw URLError(.badURL)
}`,
  ],
  medium: [
    `actor TokenBucketLimiter {
    private let capacity: Double
    private let refillRatePerSec: Double
    private var tokens: Double
    private var lastRefill: Date

    init(capacity: Double, refillRatePerSec: Double) {
        self.capacity = capacity
        self.refillRatePerSec = refillRatePerSec
        self.tokens = capacity
        self.lastRefill = Date()
    }

    func allowRequest(cost: Double = 1.0) -> Bool {
        let now = Date()
        let elapsed = now.timeIntervalSince(lastRefill)
        tokens = min(capacity, tokens + elapsed * refillRatePerSec)
        lastRefill = now

        if tokens >= cost {
            tokens -= cost
            return true
        }
        return false
    }
}`,
    `func retryWithBackoff<T>(
    maxAttempts: Int = 3,
    initialDelay: Duration = .milliseconds(100),
    operation: () async throws -> T
) async throws -> T {
    var delay = initialDelay
    for attempt in 1...maxAttempts {
        do {
            return try await operation()
        } catch {
            if attempt == maxAttempts { throw error }
            try await Task.sleep(for: delay)
            delay *= 2
        }
    }
    throw CancellationError()
}`,
    `struct Stack<Element> {
    private var storage: [Element] = []

    var isEmpty: Bool { storage.isEmpty }
    var count: Int { storage.count }

    mutating func push(_ element: Element) {
        storage.append(element)
    }

    mutating func pop() -> Element? {
        storage.popLast()
    }

    func peek() -> Element? {
        storage.last
    }
}`,
    `func binarySearch<T: Comparable>(_ array: [T], target: T) -> Int? {
    var lower = 0
    var upper = array.count - 1

    while lower <= upper {
        let mid = lower + (upper - lower) / 2
        if array[mid] == target {
            return mid
        } else if array[mid] < target {
            lower = mid + 1
        } else {
            upper = mid - 1
        }
    }
    return nil
}`,
    `@propertyWrapper
struct Clamped<Value: Comparable> {
    private var value: Value
    private let range: ClosedRange<Value>

    init(wrappedValue: Value, _ range: ClosedRange<Value>) {
        self.range = range
        self.value = min(max(wrappedValue, range.lowerBound), range.upperBound)
    }

    var wrappedValue: Value {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}`,
    `extension Sequence {
    func asyncMap<T>(
        _ transform: (Element) async throws -> T
    ) async rethrows -> [T] {
        var values = [T]()
        for element in self {
            try await values.append(transform(element))
        }
        return values
    }
}`,
  ],
  long: [
    `actor LRUCache<Key: Hashable, Value> {
    private final class Node {
        let key: Key
        var value: Value
        var prev: Node?
        var next: Node?
        init(key: Key, value: Value) { self.key = key; self.value = value }
    }

    private let capacity: Int
    private var dict: [Key: Node] = [:]
    private var head: Node?
    private var tail: Node?

    init(capacity: Int) {
        precondition(capacity > 0, "Capacity must be positive")
        self.capacity = capacity
    }

    func get(_ key: Key) -> Value? {
        guard let node = dict[key] else { return nil }
        moveToHead(node)
        return node.value
    }

    func set(_ key: Key, value: Value) {
        if let node = dict[key] {
            node.value = value
            moveToHead(node)
            return
        }
        if dict.count >= capacity, let oldTail = tail {
            dict.removeValue(forKey: oldTail.key)
            removeNode(oldTail)
        }
        let newNode = Node(key: key, value: value)
        dict[key] = newNode
        insertAtHead(newNode)
    }

    private func moveToHead(_ node: Node) {
        removeNode(node)
        insertAtHead(node)
    }

    private func removeNode(_ node: Node) {
        node.prev?.next = node.next
        node.next?.prev = node.prev
        if node === head { head = node.next }
        if node === tail { tail = node.prev }
    }

    private func insertAtHead(_ node: Node) {
        node.next = head
        node.prev = nil
        head?.prev = node
        head = node
        if tail == nil { tail = node }
    }
}`,
    `struct MinHeap<Element: Comparable> {
    private var elements: [Element] = []

    var isEmpty: Bool { elements.isEmpty }
    var count: Int { elements.count }
    var peek: Element? { elements.first }

    mutating func insert(_ element: Element) {
        elements.append(element)
        siftUp(from: elements.count - 1)
    }

    mutating func extractMin() -> Element? {
        guard !elements.isEmpty else { return nil }
        if elements.count == 1 { return elements.removeFirst() }
        let min = elements[0]
        elements[0] = elements.removeLast()
        siftDown(from: 0)
        return min
    }

    private mutating func siftUp(from index: Int) {
        var child = index
        var parent = (child - 1) / 2
        while child > 0 && elements[child] < elements[parent] {
            elements.swapAt(child, parent)
            child = parent
            parent = (child - 1) / 2
        }
    }

    private mutating func siftDown(from index: Int) {
        var parent = index
        while true {
            let left = 2 * parent + 1
            let right = 2 * parent + 2
            var candidate = parent

            if left < elements.count && elements[left] < elements[candidate] { candidate = left }
            if right < elements.count && elements[right] < elements[candidate] { candidate = right }
            if candidate == parent { return }

            elements.swapAt(parent, candidate)
            parent = candidate
        }
    }
}`,
    `struct TypingEngineSession {
    private(set) var targetText: String
    private(set) var typedBuffer: String = ""
    private(set) var errorIndices: Set<Int> = []
    private(set) var startTime: Date?
    private(set) var isFinished: Bool = false

    init(targetText: String) {
        self.targetText = targetText
    }

    mutating func handleCharacter(_ char: Character) {
        if startTime == nil { startTime = Date() }
        let currentIndex = typedBuffer.count
        guard currentIndex < targetText.count else { return }

        let targetChar = targetText[targetText.index(targetText.startIndex, offsetBy: currentIndex)]
        if char != targetChar {
            errorIndices.insert(currentIndex)
        }
        typedBuffer.append(char)

        if typedBuffer.count == targetText.count {
            isFinished = true
        }
    }

    mutating func handleBackspace() {
        guard !typedBuffer.isEmpty else { return }
        let lastIndex = typedBuffer.count - 1
        typedBuffer.removeLast()
        errorIndices.remove(lastIndex)
    }
}`,
    `final class AsyncChannel<Element: Sendable>: @unchecked Sendable {
    private var continuations: [CheckedContinuation<Element, Never>] = []
    private var buffer: [Element] = []
    private let lock = NSLock()

    func send(_ element: Element) {
        lock.lock()
        defer { lock.unlock() }

        if !continuations.isEmpty {
            let continuation = continuations.removeFirst()
            continuation.resume(returning: element)
        } else {
            buffer.append(element)
        }
    }

    func receive() async -> Element {
        await withCheckedContinuation { continuation in
            lock.lock()
            defer { lock.unlock() }

            if !buffer.isEmpty {
                let element = buffer.removeFirst()
                continuation.resume(returning: element)
            } else {
                continuations.append(continuation)
            }
        }
    }
}`,
    `final class ObservableStore<State: Equatable, Action> {
    private(set) var state: State
    private let reducer: (State, Action) -> State
    private var subscribers: [(State) -> Void] = []

    init(initialState: State, reducer: @escaping (State, Action) -> State) {
        self.state = initialState
        self.reducer = reducer
    }

    func dispatch(_ action: Action) {
        let newState = reducer(state, action)
        guard newState != state else { return }
        state = newState
        subscribers.forEach { $0(state) }
    }

    func subscribe(_ subscriber: @escaping (State) -> Void) -> () -> Void {
        subscribers.append(subscriber)
        subscriber(state)
        return { [weak self] in
            self?.subscribers.removeAll(where: { _ in false })
        }
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

    mutating func cancel() {
        task?.cancel()
        task = nil
    }
}`,
  ],
};
