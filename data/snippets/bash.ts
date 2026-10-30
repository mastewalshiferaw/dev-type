import type { SnippetSet } from './types';

export const bash: SnippetSet = {
  short: [
    `for f in *.log; do
  gzip "$f"
done`,
    `export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc`,
  ],
  medium: [
    `#!/usr/bin/env bash
set -euo pipefail

# Fail fast when an argument is missing
name="\${1:?usage: greet.sh NAME}"
echo "Hello, $name"`,
    `backup() {
  local src="$1"
  local dest="$2/$(date +%F)"
  mkdir -p "$dest"
  cp -r "$src" "$dest"
}`,
  ],
  long: [
    `#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="/var/log/app"
MAX_AGE_DAYS=14

if [[ ! -d "$LOG_DIR" ]]; then
  echo "No log directory at $LOG_DIR" >&2
  exit 1
fi

# Delete old logs and report how many were removed
count=$(find "$LOG_DIR" -name "*.log" -mtime +"$MAX_AGE_DAYS" -print -delete | wc -l)
echo "Removed $count old log files"`,
    `deploy() {
  local env="\${1:-staging}"
  case "$env" in
    staging|production)
      echo "Deploying to $env"
      ;;
    *)
      echo "Unknown env: $env" >&2
      return 1
      ;;
  esac
  git pull --ff-only
  npm ci && npm run build
}`,
  ],
};
