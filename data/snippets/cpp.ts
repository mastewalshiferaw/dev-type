import type { SnippetSet } from './types';

export const cpp: SnippetSet = {
  short: [
    `bool is_even(int n) {
    return n % 2 == 0;
}`,
    `std::vector<int> v{3, 1, 2};
std::sort(v.begin(), v.end());
for (int n : v) std::cout << n << " ";`,
    `auto square = [](int x) -> int { return x * x; };
std::cout << square(12) << std::endl;`,
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
    if (val < low) return low;
    if (val > high) return high;
    return val;
}`,
    `std::string trim(const std::string& str) {
    auto start = str.find_first_not_of(" \\t\\n\\r");
    if (start == std::string::npos) return "";
    auto end = str.find_last_not_of(" \\t\\n\\r");
    return str.substr(start, end - start + 1);
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
}

void print_list(const Node* head) {
    while (head) {
        std::cout << head->value << " -> ";
        head = head->next.get();
    }
    std::cout << "nullptr\\n";
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
    int count_;
};`,
    `#include <queue>
#include <vector>

std::vector<int> top_k_elements(const std::vector<int>& nums, int k) {
    std::priority_queue<int, std::vector<int>, std::greater<int>> min_heap;
    for (int num : nums) {
        min_heap.push(num);
        if (min_heap.size() > static_cast<size_t>(k)) {
            min_heap.pop();
        }
    }
    std::vector<int> result;
    while (!min_heap.empty()) {
        result.push_back(min_heap.top());
        min_heap.pop();
    }
    return result;
}`,
  ],
};
