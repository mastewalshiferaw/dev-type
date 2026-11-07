import type { SnippetSet } from './types';

export const ruby: SnippetSet = {
  short: [
    `def calculate_wpm(characters, elapsed_seconds)
  return 0.0 if elapsed_seconds <= 0
  words = characters / 5.0
  minutes = elapsed_seconds / 60.0
  (words / minutes).round(1)
end`,
    `UserProfile = Data.define(:id, :username, :email, :wpm) do
  def verified?
    wpm >= 60.0
  end
end`,
    `top_scorers = scores
  .select { |s| s[:accuracy] >= 95.0 }
  .max_by(5) { |s| s[:wpm] }
  .map { |s| s[:username] }`,
    `case response.status
in 200..299 => :ok
in 401 | 403 => :unauthorized
in 404 => :not_found
else => :error
end`,
    `def memoize(key)
  @cache ||= {}
  @cache[key] ||= yield
end`,
    `slug = title.downcase.strip.gsub(/[^a-z0-9\\s]/, '').gsub(/\\s+/, '-')`,
  ],
  medium: [
    `class TokenBucket
  def initialize(capacity:, refill_rate:)
    @capacity = capacity.to_f
    @refill_rate = refill_rate.to_f
    @tokens = @capacity
    @last_refill = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    @mutex = Mutex.new
  end

  def allow?(cost = 1.0)
    @mutex.synchronize do
      now = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      elapsed = now - @last_refill
      @tokens = [@capacity, @tokens + elapsed * @refill_rate].min
      @last_refill = now

      if @tokens >= cost
        @tokens -= cost
        true
      else
        false
      end
    end
  end
end`,
    `def retry_with_backoff(max_attempts: 3, base_delay: 0.2)
  attempts = 0
  begin
    attempts += 1
    yield
  rescue StandardError => e
    raise e if attempts >= max_attempts
    sleep(base_delay * (2**(attempts - 1)))
    retry
  end
end`,
    `def deep_transform_keys(object, &block)
  case object
  when Hash
    object.each_with_object({}) do |(key, value), result|
      result[yield(key)] = deep_transform_keys(value, &block)
    end
  when Array
    object.map { |item| deep_transform_keys(item, &block) }
  else
    object
  end
end`,
    `class CircularBuffer
  def initialize(capacity)
    @capacity = capacity
    @buffer = Array.new(capacity)
    @head = 0
    @tail = 0
    @size = 0
  end

  def append(item)
    @buffer[@tail] = item
    @tail = (@tail + 1) % @capacity
    if @size < @capacity
      @size += 1
    else
      @head = (@head + 1) % @capacity
    end
  end

  def to_a
    @size.times.map { |i| @buffer[(@head + i) % @capacity] }
  end
end`,
    `def binary_search(array, target)
  low = 0
  high = array.length - 1

  while low <= high
    mid = low + (high - low) / 2
    val = array[mid]
    if val == target
      return mid
    elsif val < target
      low = mid + 1
    else
      high = mid - 1
    end
  end
  nil
end`,
    `class MetricAggregator
  def initialize
    @samples = []
  end

  def record(value)
    @samples << value.to_f
  end

  def average
    return 0.0 if @samples.empty?
    (@samples.sum / @samples.size).round(2)
  end

  def percentile(p)
    return 0.0 if @samples.empty?
    sorted = @samples.sort
    index = ((sorted.size - 1) * p).round
    sorted[index]
  end
end`,
  ],
  long: [
    `class LRUCache
  Node = Struct.new(:key, :value, :prev, :next)

  def initialize(capacity)
    raise ArgumentError, 'Capacity must be positive' if capacity <= 0
    @capacity = capacity
    @cache = {}
    @head = Node.new(nil, nil)
    @tail = Node.new(nil, nil)
    @head.next = @tail
    @tail.prev = @head
  end

  def get(key)
    node = @cache[key]
    return nil unless node
    remove(node)
    add_front(node)
    node.value
  end

  def put(key, value)
    if (node = @cache[key])
      node.value = value
      remove(node)
      add_front(node)
    else
      if @cache.size >= @capacity
        oldest = @tail.prev
        remove(oldest)
        @cache.delete(oldest.key)
      end
      new_node = Node.new(key, value)
      @cache[key] = new_node
      add_front(new_node)
    end
  end

  private

  def remove(node)
    node.prev.next = node.next
    node.next.prev = node.prev
  end

  def add_front(node)
    node.next = @head.next
    node.prev = @head
    @head.next.prev = node
    @head.next = node
  end
end`,
    `class AsyncWorkerPool
  def initialize(size: 4)
    @size = size
    @queue = Thread::Queue.new
    @workers = size.times.map { start_worker }
  end

  def post(&job)
    @queue.push(job)
  end

  def shutdown
    @size.times { @queue.push(:shutdown) }
    @workers.each(&:join)
  end

  private

  def start_worker
    Thread.new do
      loop do
        task = @queue.pop
        break if task == :shutdown
        begin
          task.call
        rescue StandardError => e
          warn "Worker error: #{e.message}"
        end
      end
    end
  end
end`,
    `class EventBus
  def initialize
    @subscribers = Hash.new { |hash, key| hash[key] = [] }
    @mutex = Mutex.new
  end

  def subscribe(event_name, &listener)
    @mutex.synchronize do
      @subscribers[event_name] << listener
    end
    -> { unsubscribe(event_name, listener) }
  end

  def publish(event_name, payload)
    listeners = @mutex.synchronize { @subscribers[event_name].dup }
    listeners.each do |listener|
      listener.call(payload)
    rescue StandardError => e
      warn "EventBus listener failed for #{event_name}: #{e.message}"
    end
  end

  private

  def unsubscribe(event_name, listener)
    @mutex.synchronize do
      @subscribers[event_name].delete(listener)
    end
  end
end`,
    `class TypingTelemetry
  Snapshot = Struct.new(:timestamp, :chars_typed, :errors)

  def initialize
    @snapshots = []
  end

  def track(chars, errors)
    @snapshots << Snapshot.new(Process.clock_gettime(Process::CLOCK_MONOTONIC), chars, errors)
  end

  def error_bursts(threshold = 3)
    bursts = 0
    consecutive = 0
    @snapshots.each_cons(2) do |prev, curr|
      if curr.errors > prev.errors
        consecutive += (curr.errors - prev.errors)
        bursts += 1 if consecutive >= threshold
      else
        consecutive = 0
      end
    end
    bursts
  end
end`,
    `class MinHeap
  def initialize
    @elements = []
  end

  def push(element)
    @elements << element
    sift_up(@elements.size - 1)
  end

  def pop
    return nil if @elements.empty?
    return @elements.pop if @elements.size == 1

    root = @elements[0]
    @elements[0] = @elements.pop
    sift_down(0)
    root
  end

  private

  def sift_up(index)
    while index > 0
      parent = (index - 1) / 2
      break if @elements[index] >= @elements[parent]
      @elements[index], @elements[parent] = @elements[parent], @elements[index]
      index = parent
    end
  end

  def sift_down(index)
    size = @elements.size
    while (left = 2 * index + 1) < size
      right = left + 1
      smallest = (right < size && @elements[right] < @elements[left]) ? right : left
      break if @elements[index] <= @elements[smallest]
      @elements[index], @elements[smallest] = @elements[smallest], @elements[index]
      index = smallest
    end
  end
end`,
    `class MiddlewarePipeline
  def initialize
    @stack = []
  end

  def use(middleware)
    @stack << middleware
    self
  end

  def execute(context, &final_handler)
    runner = ->(idx) do
      if idx < @stack.size
        @stack[idx].call(context, -> { runner.call(idx + 1) })
      else
        final_handler&.call(context)
      end
    end
    runner.call(0)
  end
end`,
  ],
};
