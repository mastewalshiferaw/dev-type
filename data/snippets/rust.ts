import type { SnippetSet } from './types';

export const rust: SnippetSet = {
  short: [
    `fn is_positive(x: i32) -> bool {
    x > 0
}`,
    `let names: Vec<String> = users.iter().map(|u| u.name.clone()).collect();
println!("{:?}", names);`,
  ],
  medium: [
    `fn double(val: Option<i32>) -> i32 {
    match val {
        Some(n) => n * 2,
        None => 0,
    }
}`,
    `// Returns the longer of two string slices
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() {
        a
    } else {
        b
    }
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
}`,
    `use std::collections::HashMap;

fn word_count(text: &str) -> HashMap<&str, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        // Insert 0 the first time, then bump it
        *counts.entry(word).or_insert(0) += 1;
    }
    counts
}

fn main() {
    let counts = word_count("the quick the lazy the end");
    println!("{}", counts["the"]);
}`,
  ],
};
