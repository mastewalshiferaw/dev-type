import type { SnippetSet } from './types';

export const rust: SnippetSet = {
  short: [
    `fn is_positive(x: i32) -> bool {
    x > 0
}`,
    `let names: Vec<String> = users.iter().map(|u| u.name.clone()).collect();
println!("{:?}", names);`,
    `let doubled: Vec<i32> = (1..=5).map(|n| n * 2).collect();
assert_eq!(doubled, vec![2, 4, 6, 8, 10]);`,
  ],
  medium: [
    `fn double(val: Option<i32>) -> i32 {
    match val {
        Some(n) => n * 2,
        None => 0,
    }
}`,
    `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() {
        a
    } else {
        b
    }
}`,
    `fn parse_port(s: &str) -> Result<u16, std::num::ParseIntError> {
    s.parse::<u16>()
}`,
  ],
  long: [
    `struct Player {
    username: String,
    score: u64,
}

impl Player {
    fn new(username: &str) -> Self {
        Self { username: username.to_string(), score: 0 }
    }

    fn add_score(&mut self, points: u64) {
        self.score += points;
    }

    fn has_reached(&self, target: u64) -> bool {
        self.score >= target
    }
}`,
    `use std::collections::HashMap;

fn word_count(text: &str) -> HashMap<&str, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }
    counts
}

fn main() {
    let counts = word_count("the quick the lazy the end");
    println!("{}", counts["the"]);
}`,
    `pub enum ApiResponse<T> {
    Success(T),
    NotFound,
    Error(String),
}

impl<T> ApiResponse<T> {
    pub fn is_ok(&self) -> bool {
        matches!(self, ApiResponse::Success(_))
    }
}`,
  ],
};
