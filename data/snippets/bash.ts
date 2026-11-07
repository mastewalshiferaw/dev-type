import type { SnippetSet } from './types';

export const bash: SnippetSet = {
  short: [
    `#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="\${1:-./build}"
mkdir -p "$TARGET_DIR"
echo "Target configured: $TARGET_DIR"`,
    `find . -type f -name "*.log" -mtime +7 -print0 |
  xargs -0 -r gzip -9`,
    `git branch --merged main |
  grep -vE '(^\\*|main|master|dev)' |
  xargs -r git branch -d`,
    `while IFS='=' read -r key val; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  export "$key"="$val"
done < .env`,
    `awk -F'"' '/HTTP\\/1\\.1" 500/ { print $1, $4 }' /var/log/nginx/access.log |
  sort | uniq -c | sort -rn | head -n 10`,
    `docker ps --filter "status=exited" -q |
  xargs -r docker rm -v`,
  ],
  medium: [
    `#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  local exit_code=$?
  rm -rf "$TMP_DIR"
  echo "Cleaned up temporary workspace with status $exit_code"
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

TMP_DIR=$(mktemp -d /tmp/deploy-XXXXXX)
echo "Staged release in $TMP_DIR"`,
    `wait_for_service() {
  local host="$1"
  local port="$2"
  local retries="\${3:-15}"

  until nc -z -w 2 "$host" "$port" 2>/dev/null; do
    retries=$((retries - 1))
    if (( retries <= 0 )); then
      echo "Timeout waiting for $host:$port" >&2
      return 1
    fi
    echo "Waiting for $host:$port... ($retries left)"
    sleep 2
  done
  echo "Service at $host:$port is ready!"
}`,
    `backup_database() {
  local db_name="\${1:?Database name required}"
  local out_dir="\${2:-/var/backups/postgres}"
  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local archive="$out_dir/\${db_name}_\${timestamp}.sql.gz"

  mkdir -p "$out_dir"
  pg_dump -Fc "$db_name" | gzip -9 > "$archive"
  find "$out_dir" -name "*.sql.gz" -mtime +14 -delete
  echo "Backup saved to $archive"
}`,
    `parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -e|--env)
        ENVIRONMENT="$2"
        shift 2 ;;
      -p|--port)
        PORT="$2"
        shift 2 ;;
      -v|--verbose)
        VERBOSE=true
        shift ;;
      -h|--help)
        echo "Usage: $0 [-e dev|prod] [-p port] [-v]"
        return 0 ;;
      *)
        echo "Unknown option: $1" >&2
        return 1 ;;
    esac
  done
}`,
    `check_git_staged() {
  local staged_files
  staged_files=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\\.(ts|tsx)$' || true)

  if [[ -n "$staged_files" ]]; then
    echo "Running ESLint on staged TypeScript files..."
    echo "$staged_files" | xargs npx eslint --max-warnings=0
  else
    echo "No staged TypeScript files to lint."
  fi
}`,
    `read_json_field() {
  local file="$1"
  local key="$2"

  if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required to parse JSON" >&2
    return 1
  fi

  jq -er --arg k "$key" '.[$k]' "$file"
}`,
  ],
  long: [
    `#!/usr/bin/env bash
set -euo pipefail

deploy_service() {
  local app_name="\${1:?App name required}"
  local version="\${2:?Version required}"
  local container="\${app_name}_\${version}"
  local health_endpoint="http://localhost:8080/health"

  echo "==> Pulling container image: \${app_name}:\${version}"
  docker pull "\${app_name}:\${version}"

  echo "==> Starting new container instance: $container"
  docker run -d --name "$container" -p 8081:8080 "\${app_name}:\${version}"

  echo "==> Verifying service health..."
  for i in {1..10}; do
    if curl -sSf "$health_endpoint" >/dev/null 2>&1; then
      echo "==> Health check passed!"
      break
    fi
    if [[ $i -eq 10 ]]; then
      echo "==> Health check failed! Rolling back..." >&2
      docker stop "$container" && docker rm "$container"
      return 1
    fi
    sleep 3
  done

  echo "==> Swapping traffic and cleaning previous instance..."
  docker stop "\${app_name}_current" || true
  docker rm "\${app_name}_current" || true
  docker rename "$container" "\${app_name}_current"
  echo "==> Deployment completed successfully!"
}`,
    `#!/usr/bin/env bash
set -euo pipefail

check_disk_and_memory() {
  local disk_threshold="\${1:-85}"
  local mem_threshold="\${2:-90}"

  local disk_usage
  disk_usage=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')

  local mem_usage
  mem_usage=$(free | awk '/Mem:/ {printf("%.0f"), $3/$2 * 100}')

  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Disk: \${disk_usage}% | RAM: \${mem_usage}%"

  if (( disk_usage >= disk_threshold )); then
    echo "ALERT: Root disk usage is above threshold: \${disk_usage}%" >&2
    logger -p local0.crit "Disk alert: \${disk_usage}% used"
  fi

  if (( mem_usage >= mem_threshold )); then
    echo "ALERT: Memory usage is above threshold: \${mem_usage}%" >&2
    logger -p local0.crit "RAM alert: \${mem_usage}% used"
  fi
}

main() {
  while true; do
    check_disk_and_memory 80 85
    sleep 60
  done
}`,
    `#!/usr/bin/env bash
set -euo pipefail

sync_and_rotate_logs() {
  local src_dir="/var/log/application"
  local s3_bucket="s3://company-production-logs"
  local host_id
  host_id=$(hostname -s)
  local date_stamp
  date_stamp=$(date +%Y-%m-%d)

  if [[ ! -d "$src_dir" ]]; then
    echo "Directory $src_dir does not exist" >&2
    return 1
  fi

  for file in "$src_dir"/*.log.gz; do
    [[ -e "$file" ]] || break
    local basename
    basename=$(basename "$file")
    local dest="\${s3_bucket}/\${date_stamp}/\${host_id}/\${basename}"

    echo "Uploading $file to $dest"
    aws s3 cp "$file" "$dest" --storage-class STANDARD_IA
    rm -f "$file"
  done

  echo "Log sync finished for host: $host_id"
}`,
    `#!/usr/bin/env bash
set -euo pipefail

check_ssl_cert() {
  local domain="$1"
  local port="\${2:-443}"
  local warn_days="\${3:-21}"

  local exp_date
  exp_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:$port" 2>/dev/null |
    openssl x509 -noout -enddate | cut -d= -f2)

  if [[ -z "$exp_date" ]]; then
    echo "Failed to retrieve certificate for $domain" >&2
    return 1
  fi

  local exp_epoch now_epoch days_left
  exp_epoch=$(date -d "$exp_date" +%s)
  now_epoch=$(date +%s)
  days_left=$(( (exp_epoch - now_epoch) / 86400 ))

  if (( days_left <= warn_days )); then
    echo "WARNING: SSL for $domain expires in $days_left days ($exp_date)" >&2
    return 2
  else
    echo "OK: SSL for $domain is valid for $days_left days"
  fi
}`,
    `#!/usr/bin/env bash
set -euo pipefail

run_ci_matrix() {
  local tasks=("lint" "typecheck" "test:unit" "test:e2e")
  local pids=()
  local failed=0

  echo "==> Starting parallel CI matrix execution..."
  for task in "\${tasks[@]}"; do
    (
      echo "[$task] Starting..."
      if npm run "$task" > "ci-$task.log" 2>&1; then
        echo "[$task] PASSED"
      else
        echo "[$task] FAILED" >&2
        exit 1
      fi
    ) &
    pids+=($!)
  done

  for pid in "\${pids[@]}"; do
    if ! wait "$pid"; then
      failed=$((failed + 1))
    fi
  done

  if (( failed > 0 )); then
    echo "CI Matrix failed with $failed broken job(s)" >&2
    exit 1
  fi
  echo "All CI jobs passed successfully!"
}`,
    `#!/usr/bin/env bash
set -euo pipefail

rotate_database_password() {
  local secret_id="prod/db/credentials"
  local user="app_user"

  echo "Generating cryptographically secure password..."
  local new_pass
  new_pass=$(openssl rand -base64 32 | tr -d '/+=')

  echo "Updating password in PostgreSQL..."
  psql "$DATABASE_URL" -c "ALTER USER \${user} WITH PASSWORD '\${new_pass}';"

  echo "Saving new credentials to AWS Secrets Manager..."
  aws secretsmanager put-secret-value \\
    --secret-id "$secret_id" \\
    --secret-string "{\\"username\\":\\"$user\\",\\"password\\":\\"$new_pass\\"}"

  echo "Sending SIGHUP to application daemon to reload configuration..."
  pkill -HUP -f "puma" || true
  echo "Database credentials rotated successfully."
}`,
  ],
};
