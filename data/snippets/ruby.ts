import type { SnippetSet } from './types';

export const ruby: SnippetSet = {
  short: [
    `evens = (1..20).select(&:even?)
puts evens.sum`,
    `def greet(name = "world")
  "Hello, #{name}!"
end`,
  ],
  medium: [
    `class User
  attr_reader :name, :email

  def initialize(name:, email:)
    @name = name
    @email = email.downcase
  end
end`,
    `# Group words by their first letter
words = %w[apple avocado banana blueberry cherry]
index = words.group_by { |w| w[0] }
index.each do |letter, list|
  puts "#{letter}: #{list.join(', ')}"
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
      sleep(wait * tries) # back off a little more each time
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
  ],
};
