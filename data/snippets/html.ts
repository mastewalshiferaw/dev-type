import type { SnippetSet } from './types';

export const html: SnippetSet = {
  short: [
    `<button type="button" class="btn btn-primary" aria-label="Close dialog">
  <svg class="icon" aria-hidden="true" width="16" height="16">
    <use href="#icon-cross" />
  </svg>
  <span>Dismiss</span>
</button>`,
    `<div class="avatar-badge">
  <img class="avatar-img" src="/avatars/01.png" alt="Sarah Connor" />
  <span class="status-indicator online" aria-label="Status: Online"></span>
</div>`,
    `<label class="toggle-switch">
  <input type="checkbox" role="switch" aria-checked="true" checked />
  <span class="slider round"></span>
  <span class="toggle-label">Dark Mode</span>
</label>`,
    `<form class="search-box" role="search">
  <input type="search" name="q" placeholder="Search repositories..." autocomplete="off" />
  <kbd class="shortcut-key">Cmd + K</kbd>
</form>`,
    `.badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}`,
    `.glass-panel {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
}`,
  ],
  medium: [
    `<nav class="navbar" aria-label="Primary navigation">
  <div class="nav-brand">
    <a href="/" class="brand-logo">DevType</a>
  </div>
  <ul class="nav-links">
    <li><a href="/leaderboard" class="nav-item">Leaderboard</a></li>
    <li><a href="/practice" class="nav-item active" aria-current="page">Practice</a></li>
    <li><a href="/settings" class="nav-item">Settings</a></li>
  </ul>
  <div class="nav-actions">
    <button class="btn btn-ghost" type="button">Sign In</button>
  </div>
</nav>`,
    `<dialog id="confirm-modal" class="modal-dialog">
  <form method="dialog" class="modal-content">
    <h2 class="modal-title">Delete Project?</h2>
    <p class="modal-desc">This action cannot be undone. All database records will be erased.</p>
    <div class="modal-actions">
      <button value="cancel" class="btn btn-secondary">Cancel</button>
      <button value="confirm" class="btn btn-danger">Confirm Delete</button>
    </div>
  </form>
</dialog>`,
    `<article class="blog-card" data-category="tutorials">
  <header class="card-header">
    <span class="category-tag">Rust</span>
    <time datetime="2026-10-15">Oct 15, 2026</time>
  </header>
  <h3 class="card-title">
    <a href="/posts/async-rust">Deep Dive into Async Runtimes</a>
  </h3>
  <p class="card-excerpt">Learn how work-stealing schedulers multiplex green tasks across CPU cores.</p>
  <footer class="card-meta">
    <span class="read-time">6 min read</span>
  </footer>
</article>`,
    `:root {
  --color-primary: #3b82f6;
  --color-surface: #1e293b;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-md: 0.5rem;
}

.code-container {
  font-family: var(--font-mono);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  overflow-x: auto;
  line-height: 1.6;
}`,
    `<div class="stat-card">
  <div class="stat-header">
    <span class="stat-title">Average WPM</span>
    <span class="trend-badge positive">+12.4%</span>
  </div>
  <div class="stat-value">94.6</div>
  <div class="progress-bar-container" role="progressbar" aria-valuenow="94" aria-valuemin="0" aria-valuemax="160">
    <div class="progress-bar-fill" style="width: 59%;"></div>
  </div>
</div>`,
    `@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.4));
  }
  50% {
    opacity: 0.7;
    transform: scale(0.98);
    filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.1));
  }
}

.glowing-cursor {
  animation: pulse-glow 1.8s ease-in-out infinite;
}`,
  ],
  long: [
    `<form class="auth-form" method="POST" action="/api/v1/auth/signup" novalidate>
  <fieldset class="form-section">
    <legend class="section-title">Create your Developer Account</legend>

    <div class="field-group">
      <label for="username" class="field-label">Username</label>
      <input id="username" name="username" type="text" required minlength="3" maxlength="24"
        pattern="^[a-zA-Z0-9_-]+$" placeholder="octocat" autocomplete="username" />
      <span class="field-hint">Letters, numbers, dashes, and underscores only.</span>
    </div>

    <div class="field-group">
      <label for="email" class="field-label">Work Email</label>
      <input id="email" name="email" type="email" required placeholder="developer@company.com"
        autocomplete="email" />
    </div>

    <div class="field-group">
      <label for="password" class="field-label">Password</label>
      <input id="password" name="password" type="password" required minlength="12"
        autocomplete="new-password" aria-describedby="password-rules" />
      <p id="password-rules" class="field-hint">Must contain at least 12 characters.</p>
    </div>

    <div class="checkbox-group">
      <input id="terms" name="terms" type="checkbox" required />
      <label for="terms">I agree to the Terms of Service and Privacy Policy</label>
    </div>

    <button type="submit" class="btn btn-primary submit-btn">
      <span>Get Started</span>
    </button>
  </fieldset>
</form>`,
    `<section class="pricing-matrix" aria-labelledby="pricing-heading">
  <div class="matrix-header">
    <h2 id="pricing-heading" class="title">Choose Your Tier</h2>
    <p class="subtitle">Level up your typing precision with custom analytics</p>
  </div>
  <div class="cards-grid">
    <div class="pricing-card">
      <h3 class="plan-name">Hobbyist</h3>
      <div class="price-display"><span class="currency">$</span>0<span class="freq">/mo</span></div>
      <ul class="feature-list">
        <li>Unlimited standard tests</li>
        <li>15 programming languages</li>
        <li>Public leaderboard ranking</li>
      </ul>
      <a href="/start" class="btn btn-outline">Start Free</a>
    </div>
    <div class="pricing-card featured">
      <span class="popular-tag">Most Popular</span>
      <h3 class="plan-name">Pro Engineer</h3>
      <div class="price-display"><span class="currency">$</span>12<span class="freq">/mo</span></div>
      <ul class="feature-list">
        <li>Detailed keystroke heatmap</li>
        <li>Custom AST snippet generators</li>
        <li>Private team leaderboards</li>
        <li>Zero latency regional edge runs</li>
      </ul>
      <a href="/checkout?plan=pro" class="btn btn-accent">Upgrade to Pro</a>
    </div>
  </div>
</section>`,
    `<div class="table-wrapper" role="region" aria-label="Global Leaderboard" tabindex="0">
  <table class="data-table">
    <thead>
      <tr>
        <th scope="col" class="col-rank">#</th>
        <th scope="col" class="col-user">Developer</th>
        <th scope="col" class="col-lang">Language</th>
        <th scope="col" class="col-wpm">Speed</th>
        <th scope="col" class="col-acc">Accuracy</th>
        <th scope="col" class="col-date">Date</th>
      </tr>
    </thead>
    <tbody>
      <tr class="top-tier">
        <td class="rank-cell"><span class="medal gold">1</span></td>
        <td class="user-cell"><strong>kestrel_dev</strong></td>
        <td><span class="pill-lang rust">Rust</span></td>
        <td class="metric-wpm">142 WPM</td>
        <td class="metric-acc">99.4%</td>
        <td class="date-cell">2 hours ago</td>
      </tr>
      <tr>
        <td class="rank-cell"><span class="medal silver">2</span></td>
        <td class="user-cell"><strong>async_ninja</strong></td>
        <td><span class="pill-lang go">Go</span></td>
        <td class="metric-wpm">138 WPM</td>
        <td class="metric-acc">98.8%</td>
        <td class="date-cell">5 hours ago</td>
      </tr>
    </tbody>
  </table>
</div>`,
    `:root {
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --bg-canvas: #090d16;
  --bg-card: #111827;
  --border-subtle: #1f2937;
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --brand-amber: #f59e0b;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg-canvas: #f8fafc;
    --bg-card: #ffffff;
    --border-subtle: #e2e8f0;
    --text-main: #0f172a;
    --text-muted: #64748b;
  }
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background-color: var(--bg-canvas);
  color: var(--text-main);
  font-family: var(--font-sans);
}

.sidebar-nav {
  border-right: 1px solid var(--border-subtle);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}`,
    `<header class="site-header">
  <div class="header-inner container">
    <div class="brand-group">
      <svg class="brand-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      <span class="brand-name">DevType</span>
    </div>
    <div class="header-controls">
      <div class="segmented-control" role="radiogroup" aria-label="Test Duration">
        <button class="seg-btn" role="radio" aria-checked="false">15s</button>
        <button class="seg-btn active" role="radio" aria-checked="true">30s</button>
        <button class="seg-btn" role="radio" aria-checked="false">60s</button>
        <button class="seg-btn" role="radio" aria-checked="false">120s</button>
      </div>
      <button class="btn btn-secondary icon-btn" aria-label="Open Settings">
        <svg class="gear-icon" width="20" height="20" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
  </div>
</header>`,
    `<div class="media-player" role="region" aria-label="Terminal audio feedback">
  <div class="track-info">
    <div class="wave-visualizer">
      <span class="bar bar-1"></span>
      <span class="bar bar-2"></span>
      <span class="bar bar-3"></span>
      <span class="bar bar-4"></span>
    </div>
    <span class="soundpack-name">Mechanical Cherry MX Blue</span>
  </div>
  <div class="audio-controls">
    <button class="btn-play-pause" aria-label="Mute sound effects">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    </button>
    <input type="range" class="volume-slider" min="0" max="100" value="70" aria-label="Feedback volume" />
  </div>
</div>`,
  ],
};
