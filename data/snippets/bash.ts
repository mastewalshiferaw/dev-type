import type { SnippetSet } from './types';

export const bash: SnippetSet = {
  short: [
    `for f in *.log; do
  gzip -9 "$f"
done`,
    `export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc`,
    `mkdir -p src/{components,hooks,utils}
touch src/index.ts`,
  ],
  medium: [
    `#!/usr/bin/env bash
set -euo pipefail

name="\${1:?usage: greet.sh NAME}"
echo "Hello, $name"`,
    `backup() {
  local src="$1"
  local dest="$2/$(date +%F)"
  mkdir -p "$dest"
  cp -r "$src" "$dest"
}`,
    `check_service() {
  local service="$1"
  if systemctl is-active --quiet "$service"; then
    echo "$service is running"
  else
    echo "$service is offline" >&2
    return 1
  fi
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
    `monitor_disk() {
  local threshold="\${1:-85}"
  local usage
  usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
  if (( usage >= threshold )); then
    echo "Disk space critical: \${usage}% used" >&2
    return 1
  fi
  echo "Disk healthy: \${usage}% used"
}`,
  ],
};
