import type { SnippetSet } from './types';

export const rust: SnippetSet = {
  short: [
    `pub fn parse_header(line: &str) -> Option<(&str, &str)> {
    let (key, value) = line.split_once(':')?;
    Some((key.trim(), value.trim()))
}`,
    `let scores: Vec<u32> = raw_inputs
    .iter()
    .filter_map(|s| s.trim().parse::<u32>().ok())
    .filter(|&score| score >= 60)
    .collect();`,
    `match response.status {
    200..=299 => Ok(response.body),
    401 | 403 => Err(AppError::Unauthorized),
    404 => Err(AppError::NotFound(response.endpoint)),
    status => Err(AppError::Http(status)),
}`,
    `#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct Config {
    pub max_retries: u32,
    pub timeout_ms: u64,
    pub debug_mode: bool,
}`,
    `use std::sync::atomic::{AtomicUsize, Ordering};

pub fn record_keystroke(counter: &AtomicUsize) -> usize {
    counter.fetch_add(1, Ordering::Relaxed) + 1
}`,
    `let pairs: Vec<(&str, &str)> = query
    .split('&')
    .filter_map(|param| param.split_once('='))
    .collect();`,
  ],
  medium: [
    `use std::fmt;

#[derive(Debug)]
pub enum DatabaseError {
    ConnectionFailed(String),
    QueryTimeout(u64),
    NotFound { table: &'static str, id: u64 },
}

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ConnectionFailed(msg) => write!(f, "database connection error: {msg}"),
            Self::QueryTimeout(ms) => write!(f, "query timed out after {ms}ms"),
            Self::NotFound { table, id } => write!(f, "record {id} not found in {table}"),
        }
    }
}

impl std::error::Error for DatabaseError {}`,
    `use std::collections::HashMap;
use std::sync::{Arc, RwLock};

#[derive(Clone, Default)]
pub struct MemoryCache {
    store: Arc<RwLock<HashMap<String, Vec<u8>>>>,
}

impl MemoryCache {
    pub fn get(&self, key: &str) -> Option<Vec<u8>> {
        let read = self.store.read().ok()?;
        read.get(key).cloned()
    }

    pub fn insert(&self, key: String, data: Vec<u8>) {
        if let Ok(mut write) = self.store.write() {
            write.insert(key, data);
        }
    }
}`,
    `pub struct Fibonacci {
    curr: u64,
    next: u64,
}

impl Fibonacci {
    pub fn new() -> Self {
        Self { curr: 0, next: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let new_next = self.curr.checked_add(self.next)?;
        let output = self.curr;
        self.curr = self.next;
        self.next = new_next;
        Some(output)
    }
}`,
    `pub fn binary_search<T: Ord>(slice: &[T], target: &T) -> Option<usize> {
    let mut low = 0;
    let mut high = slice.len();

    while low < high {
        let mid = low + (high - low) / 2;
        match slice[mid].cmp(target) {
            std::cmp::Ordering::Less => low = mid + 1,
            std::cmp::Ordering::Equal => return Some(mid),
            std::cmp::Ordering::Greater => high = mid,
        }
    }
    None
}`,
    `use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct TypingMetric {
    pub user_id: String,
    pub language: String,
    pub wpm: f64,
    pub accuracy: f64,
    pub raw_cps: f64,
    #[serde(default)]
    pub is_verified: bool,
}

pub fn validate_metric(metric: &TypingMetric) -> Result<(), &'static str> {
    if metric.wpm < 0.0 || metric.wpm > 350.0 {
        return Err("WPM value out of realistic bounds");
    }
    if !(0.0..=100.0).contains(&metric.accuracy) {
        return Err("Accuracy must be between 0 and 100");
    }
    Ok(())
}`,
    `use tokio::sync::mpsc;

pub async fn run_producer_consumer() {
    let (tx, mut rx) = mpsc::channel::<u32>(32);

    tokio::spawn(async move {
        for n in 1..=10 {
            if tx.send(n * n).await.is_err() {
                break;
            }
        }
    });

    while let Some(value) = rx.recv().await {
        println!("Received squared event: {value}");
    }
}`,
  ],
  long: [
    `use std::collections::HashMap;

pub struct LruCache<K, V> {
    capacity: usize,
    map: HashMap<K, (V, usize)>,
    access_counter: usize,
}

impl<K: std::hash::Hash + Eq + Clone, V: Clone> LruCache<K, V> {
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0, "Capacity must be positive");
        Self {
            capacity,
            map: HashMap::new(),
            access_counter: 0,
        }
    }

    pub fn get(&mut self, key: &K) -> Option<V> {
        self.access_counter += 1;
        let counter = self.access_counter;
        let entry = self.map.get_mut(key)?;
        entry.1 = counter;
        Some(entry.0.clone())
    }

    pub fn insert(&mut self, key: K, value: V) {
        self.access_counter += 1;
        if self.map.len() >= self.capacity && !self.map.contains_key(&key) {
            if let Some((lru_key, _)) = self.map.iter().min_by_key(|(_, (_, tick))| *tick) {
                let stale_key = lru_key.clone();
                self.map.remove(&stale_key);
            }
        }
        self.map.insert(key, (value, self.access_counter));
    }
}`,
    `use std::time::{Duration, Instant};

pub struct TokenBucket {
    capacity: f64,
    tokens: f64,
    refill_rate_per_sec: f64,
    last_refill: Instant,
}

impl TokenBucket {
    pub fn new(capacity: usize, refill_rate_per_sec: f64) -> Self {
        Self {
            capacity: capacity as f64,
            tokens: capacity as f64,
            refill_rate_per_sec,
            last_refill: Instant::now(),
        }
    }

    pub fn take(&mut self, tokens: f64) -> bool {
        self.refill();
        if self.tokens >= tokens {
            self.tokens -= tokens;
            true
        } else {
            false
        }
    }

    fn refill(&mut self) {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        self.tokens = (self.tokens + elapsed * self.refill_rate_per_sec).min(self.capacity);
        self.last_refill = now;
    }
}`,
    `pub struct Draft;
pub struct InReview { pub reviewer: String }
pub struct Published { pub url: String }

pub struct BlogPost<State> {
    pub title: String,
    pub content: String,
    state: State,
}

impl BlogPost<Draft> {
    pub fn new(title: impl Into<String>, content: impl Into<String>) -> Self {
        Self { title: title.into(), content: content.into(), state: Draft }
    }

    pub fn submit_review(self, reviewer: impl Into<String>) -> BlogPost<InReview> {
        BlogPost {
            title: self.title,
            content: self.content,
            state: InReview { reviewer: reviewer.into() },
        }
    }
}

impl BlogPost<InReview> {
    pub fn publish(self, url: impl Into<String>) -> BlogPost<Published> {
        BlogPost {
            title: self.title,
            content: self.content,
            state: Published { url: url.into() },
        }
    }
}`,
    `use tokio::sync::broadcast;
use tokio::time::{sleep, Duration};

pub async fn run_supervised_worker(
    worker_id: usize,
    mut shutdown_rx: broadcast::Receiver<()>,
) -> Result<(), String> {
    println!("Worker {worker_id} started.");

    loop {
        tokio::select! {
            _ = sleep(Duration::from_millis(100)) => {
                // Perform periodic background task
            }
            res = shutdown_rx.recv() => {
                match res {
                    Ok(_) => {
                        println!("Worker {worker_id} received shutdown signal.");
                        break;
                    }
                    Err(err) => return Err(format!("Shutdown error: {err}")),
                }
            }
        }
    }

    println!("Worker {worker_id} cleanly stopped.");
    Ok(())
}`,
    `use std::collections::HashMap;

#[derive(Default)]
pub struct TrieNode {
    children: HashMap<char, TrieNode>,
    is_terminal: bool,
}

#[derive(Default)]
pub struct Trie {
    root: TrieNode,
}

impl Trie {
    pub fn insert(&mut self, word: &str) {
        let mut current = &mut self.root;
        for ch in word.chars() {
            current = current.children.entry(ch).or_default();
        }
        current.is_terminal = true;
    }

    pub fn starts_with(&self, prefix: &str) -> bool {
        let mut current = &self.root;
        for ch in prefix.chars() {
            match current.children.get(&ch) {
                Some(next_node) => current = next_node,
                None => return false,
            }
        }
        true
    }
}`,
    `pub trait ServiceHandler: Send + Sync {
    fn handle(&self, request_path: &str) -> Result<String, u16>;
}

pub struct Router {
    routes: std::collections::HashMap<String, Box<dyn ServiceHandler>>,
}

impl Router {
    pub fn new() -> Self {
        Self { routes: std::collections::HashMap::new() }
    }

    pub fn register(&mut self, path: &str, handler: Box<dyn ServiceHandler>) {
        self.routes.insert(path.to_string(), handler);
    }

    pub fn dispatch(&self, path: &str) -> (u16, String) {
        match self.routes.get(path) {
            Some(handler) => match handler.handle(path) {
                Ok(body) => (200, body),
                Err(code) => (code, "Internal error".to_string()),
            },
            None => (404, "Route not found".to_string()),
        }
    }
}`,
  ],
};
