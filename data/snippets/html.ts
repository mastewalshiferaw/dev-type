import type { SnippetSet } from './types';

export const html: SnippetSet = {
  short: [
    `<button type="button" class="btn" aria-pressed="false">
  Toggle
</button>`,
    `.card:hover {
  transform: translateY(-2px);
}`,
  ],
  medium: [
    `<nav aria-label="Main">
  <ul class="nav">
    <li><a href="/" aria-current="page">Home</a></li>
    <li><a href="/docs">Docs</a></li>
    <li><a href="/blog">Blog</a></li>
  </ul>
</nav>`,
    `/* Center anything inside a grid cell */
.center {
  display: grid;
  place-items: center;
  min-height: 100dvh;
}`,
  ],
  long: [
    `<form class="signup" action="/api/signup" method="post">
  <!-- Native validation before any JavaScript -->
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required />

  <label for="password">Password</label>
  <input id="password" name="password" type="password" minlength="8" required />

  <button type="submit">Create account</button>
</form>`,
    `:root {
  --accent: #fbbf24;
  --radius: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}`,
  ],
};
