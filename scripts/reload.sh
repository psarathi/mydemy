#!/usr/bin/env bash
set -euo pipefail

cd /opt/mydemy

echo "🔄 Reloading mydemy..."
if ! pm2 reload mydemy 2>/dev/null; then
  echo "   (cold start) registering fresh"
  pm2 delete mydemy 2>/dev/null || true
  pm2 start npm --name "mydemy" -- start
fi

pm2 save
echo "🎉 mydemy is now running!"
pm2 list
