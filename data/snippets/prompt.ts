import type { SnippetSet } from './types';

export const prompt: SnippetSet = {
  short: [
    `You are an expert full-stack developer and AI pair programmer.
Analyze the codebase carefully before answering.
Output only concise, production-ready code without boilerplate.`,
    `<thinking>
Identify edge cases: empty strings, concurrent requests, null values.
Select Dijkstra's algorithm for shortest path in weighted non-negative graph.
</thinking>`,
    `Task: Generate a type-safe API client wrapper.
Constraint: Zero external dependencies beyond native fetch.
Return format: TypeScript with strict null checks enabled.`,
    `Always use TypeScript strict mode and avoid using 'any'.
Favor composition over inheritance and keep functions under 30 lines.
Verify build with \`npm run typecheck\` before finishing.`,
    `<tool_call>
{"name": "search_codebase", "arguments": {"query": "authSessionHandler"}}
</tool_call>`,
    `Let's think step by step:
1. Parse incoming payload and validate authorization headers.
2. Check Redis cache for an active session token.
3. If missed, query postgres and populate cache with 15m TTL.`,
  ],
  medium: [
    `You are an autonomous AI coding agent operating inside a Next.js repository.
Follow these behavioral principles:
- Always check existing interfaces before writing duplicate implementations.
- Write unit tests for new utility functions using Vitest or Jest.
- Never hardcode secrets or API keys; always read from process.env.
- Return diffs in GitHub flavored markdown with clear descriptions.`,
    `<context>
User wants to migrate a legacy React SPA to Next.js App Router.
Current state: Redux toolkit, React Router 6, Axios, custom CSS modules.
Target state: React Server Components, Server Actions, Tailwind CSS.
</context>
<instruction>
Provide a phased migration roadmap prioritizing low-risk routing changes first.
</instruction>`,
    `Respond with a JSON object adhering to the following schema:
{
  "name": "analyze_performance",
  "parameters": {
    "bottlenecks": ["array of detected slow operations"],
    "suggested_indexes": ["array of SQL table column index recommendations"],
    "estimated_speedup_factor": 2.5
  }
}
Do not include any conversational filler outside the JSON payload.`,
    `<thinking>
The user encounters a Hydration Mismatch error in Next.js.
Likely causes:
- Date.now() or Math.random() rendered directly on server and client.
- LocalStorage accessed during initial render without useSyncExternalStore.
- Browser extensions injecting DOM nodes into body.
Let's provide the useSyncExternalStore or mounted check solution.
</thinking>`,
    `You are a senior principal engineer pair programming with me.
- Be concise. Don't explain basic programming concepts.
- When refactoring, retain existing docstrings and comments.
- Always provide full, working files rather than snippets with 'TODO' comments.
- Prefer immutability and functional array methods (map, filter, reduce).
- Ensure all React components handle loading and error states gracefully.`,
    `Step 1: Critique the previous solution for algorithmic complexity and memory leaks.
Step 2: Propose three alternative caching strategies (LRU, TTL, LFU).
Step 3: Benchmark memory footprint when scaling to 100,000 active socket connections.
Step 4: Output the optimal Rust implementation utilizing Arc<RwLock<T>>.`,
  ],
  long: [
    `You are an advanced agentic assistant. Follow these instructions strictly:
<guidelines>
1. Always read existing code before generating modifications.
2. Maintain documentation integrity and preserve user comments.
3. Execute shell commands to verify syntax and ensure all unit tests pass.
4. When writing SQL migrations, include down-migrations and idempotent constraints.
</guidelines>
<execution_plan>
- Step 1: Discover database schema and examine foreign key relationships.
- Step 2: Implement composite unique index on (player_name, score).
- Step 3: Run regression tests to verify no duplicate violations occur.
</execution_plan>
Now proceed with Step 1 and outline your initial findings.`,
    `You are building an MCP server in TypeScript for filesystem navigation.
Here is the tool specification:
<tool_definition>
{
  "name": "read_multiple_files",
  "description": "Reads contents of several files concurrently up to 1MB total.",
  "input_schema": {
    "type": "object",
    "properties": {
      "paths": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["paths"]
  }
}
</tool_definition>
Implement handler with graceful per-file error trapping and return structured text.`,
    `# Role & Tone
Act as a staff software engineer and pairing copilot.
Adopt a collaborative, pragmatic tone focused on rapid prototyping and clean architecture.

# Instructions
1. First produce a minimal working prototype (MVP) to test core assumptions.
2. Extract common logic into composable hooks and reusable utilities.
3. Optimize for readability first, performance second. Avoid premature abstraction.
4. If a bug is reported, write a failing reproduction test before attempting any fix.
5. Provide precise line-by-line diffs or drop-in code blocks.

# Constraints
- Framework: Next.js (App Router, React 19)
- Database: Supabase PostgreSQL with Row Level Security (RLS)
- Styling: Tailwind CSS with dark-mode first palette`,
    `<rubric>
Evaluate the model response on a 1-5 scale across three dimensions:
- Factuality: Does the code compile and correctly solve the stated problem?
- Safety: Does the solution avoid SQL injections, XSS, and unhandled exceptions?
- Elegance: Is the code idiomatic, well-typed, and easy for developers to maintain?
</rubric>
<input_code>
function getUserInput(query) {
  return db.execute("SELECT * FROM users WHERE id = " + query.id);
}
</input_code>
Provide your breakdown inside <evaluation> tags and explain the critical vulnerability.`,
  ],
};
