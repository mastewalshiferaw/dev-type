# Changelog

All notable changes to the DEV_TYPE project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-11-08

### Security & Anti-Tampering

- **Leaderboard Score Spoofing Prevention**:
  - Enforced PostgreSQL table-level constraints on `public.scores` (`CHECK (wpm >= 1 AND wpm <= 350)` and `CHECK (accuracy >= 0 AND accuracy <= 100)`).
  - Purged any existing corrupted or spoofed scores (including 9,999 WPM entries).
  - Blocked anonymous and direct PostgREST spoofing via hardened RLS `INSERT` policy with a 5-minute timestamp validity window.
  - Revoked public `UPDATE` and `DELETE` on `public.scores` to enforce write-once immutability.
- **Identity Impersonation Guard**:
  - RLS insert policy verifies that authenticated users can only submit scores matching their own `auth.uid()`, and guest submissions must have `user_id IS NULL`.
- **Admin Privilege Escalation Fix**:
  - Replaced mutable `raw_user_meta_data` check in `is_admin()` SQL function with protected `app_metadata` and hardcoded verified administrator emails.
- **PII / Email Leak Prevention**:
  - Shielded user email addresses from public scraping by removing email fields from `public.profiles` upserts; user emails remain strictly isolated within `auth.users`.
- **DoS & Loop Circuit-Breaker**:
  - Added a 20-iteration circuit breaker with random hex suffix generation to `handle_new_user_profile()` to eliminate query timeout risks under username collisions.
- **Client & API DoS Protection**:
  - Bounded `/api/admin/testimonials` GET queries with `.limit(100)` and converted full-table array scans to lightweight `{ count: 'exact', head: true }` metadata queries.
  - Enforced 6–72 character length boundaries on client-side password inputs during signup and signin.
- **Scoped Historical Score Migrations**:
  - Scoped historical username score updates in `updateAuthUsername` strictly to `user_id = auth.uid()` rather than unscoped string pattern matching.

### UI & Client Defenses

- **Client-Side Query Filtering**:
  - Added `.lte('wpm', 350).gt('wpm', 0).lte('accuracy', 100).gte('accuracy', 0)` directly to PostgREST queries in `lib/leaderboard/supabase.ts`.
- **Rendering & Calculation Sanitization**:
  - Filtered all calculations in `lib/leaderboard/rank.ts` (`rankEntries`) to discard scores with `wpm > 350 || wpm <= 0 || accuracy > 100`.
  - Added safeguard in `LeaderboardRow.tsx` so unverified/tampered scores render as `'–'` rather than inflated numbers.
  - Prevented invalid entries from distorting account metrics, personal bests, streak records, and GitHub-style contribution graphs in `AccountView.tsx` and `ContributionGraph.tsx`.
  - Added pre-submission guard in `ResultsPanel.tsx` rejecting attempts to submit invalid metrics.

### Content & Snippets

- **Multi-Language Snippet Expansion**:
  - Expanded and upgraded test code across all 15 supported programming languages (TypeScript, JavaScript, Python, Rust, Go, C++, C, C#, Java, Kotlin, Swift, PHP, Ruby, SQL, Shell) with real-world idiomatic algorithms, design patterns, and system implementations.

### Database Migrations

- Added `20261107000000_purge_and_prevent_score_spoofing.sql` (initial purge and CHECK constraints).
- Added `20261107010000_comprehensive_security_lockdown.sql` (self-healing, idempotent consolidation of all security policies and constraints).
