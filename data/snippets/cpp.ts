import type { SnippetSet } from './types';

export const cpp: SnippetSet = {
  short: [
    `bool is_even(int n) {
    return n % 2 == 0;
}`,
    `std::vector<int> v{3, 1, 2};
std::sort(v.begin(), v.end());`,
  ],
  medium: [
    `int binary_search(const std::vector<int>& arr, int x) {
    int l = 0, r = static_cast<int>(arr.size()) - 1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == x) return mid;
        arr[mid] < x ? l = mid + 1 : r = mid - 1;
    }
    return -1;
}`,
    `template <typename T>
T clamp(T val, T low, T high) {
    // Pin val into the [low, high] range
    if (val < low) return low;
    if (val > high) return high;
    return val;
}`,
  ],
  long: [
    `#include <iostream>
#include <memory>

struct Node {
    int value;
    std::unique_ptr<Node> next;
};

void push_front(std::unique_ptr<Node>& head, int value) {
    auto node = std::make_unique<Node>();
    node->value = value;
    node->next = std::move(head);
    head = std::move(node);
}`,
    `class Counter {
public:
    explicit Counter(int start = 0) : count_(start) {}

    Counter& operator++() {
        ++count_;
        return *this;
    }

    int value() const { return count_; }

private:
    int count_; /* never negative */
};`,
  ],
};
