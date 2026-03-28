#!/bin/bash
# Apollo Dashboard Sync - Run every 30 minutes

export HOME="/Users/poseidon"
export META_ACCESS_TOKEN="EAAVKxhZB0TGQBRHLaAYzZBIZAkstaQlxB43iNoTBkQJmV9tFSsrU4AUlxu0CkbCkhSIEEEFZCNSNnhEzKnu2OyZCUiVCgZCex6S4pSOoYZBMsAnqyGjlelbs5EYV1MuPZBRoQWGD0ND8MAjIAT2zPZBxxJfV9GLZAMJvWsvffDq9xl8C3kxmXWd1sIrySHMGWBJwZDZD"

cd "$HOME/.openclaw/workspace/meta-ads" || exit 1

# Run sync
node scripts/sync-to-dashboard.js >> "$HOME/.openclaw/workspace/meta-ads/logs/sync.log" 2>&1

# Log timestamp
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sync completed" >> "$HOME/.openclaw/workspace/meta-ads/logs/sync.log"
