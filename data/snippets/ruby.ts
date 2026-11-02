import type { SnippetSet } from './types';

export const ruby: SnippetSet = {
  short: [
    `evens = (1..20).select(&:even?)
puts evens.sum`,
    `def greet(name = "world")
  "Hello, #{name}!"
end`,
    `words = %w[ruby rails crystal python]
puts words.map(&:capitalize).join(', ')`,
  ],
  medium: [
    `class User
  attr_reader :name, :email

  def initialize(name:, email:)
    @name = name
    @email = email.downcase
  end
end`,
    `words = %w[apple avocado banana blueberry cherry]
index = words.group_by { |w| w[0] }
index.each do |letter, list|
  puts "#{letter}: #{list.join(', ')}"
end`,
    `def deep_symbolize_keys(hash)
  hash.each_with_object({}) do |(key, value), result|
    new_key = key.is_a?(String) ? key.to_sym : key
    new_value = value.is_a?(Hash) ? deep_symbolize_keys(value) : value
    result[new_key] = new_value
  end
end`,
  ],
  long: [
    `module Retry
  def self.with_retries(attempts: 3, wait: 0.5)
    tries = 0
    begin
      tries += 1
      yield
    rescue StandardError => e
      raise e if tries >= attempts
      sleep(wait * tries)
      retry
    end
  end
end

Retry.with_retries { fetch_report! }`,
    `class Stack
  include Enumerable

  def initialize
    @items = []
  end

  def push(item)
    @items.push(item)
    self
  end

  def pop
    @items.pop
  end

  def each(&block)
    @items.each(&block)
  end
end`,
    `class RequestLogger
  def initialize(app, logger = Logger.new($stdout))
    @app = app
    @logger = logger
  end

  def call(env)
    start_time = Time.now
    status, headers, body = @app.call(env)
    duration = (Time.now - start_time) * 1000
    @logger.info "#{env['REQUEST_METHOD']} #{env['PATH_INFO']} - #{status} (#{duration.round(2)}ms)"
    [status, headers, body]
  end
end`,
  ],
};
