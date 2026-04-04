#!/usr/bin/env sh
# Always use port 3000: free it first, then start Next.
PORT=3000
PIDS=$(lsof -ti ":$PORT" 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "Port $PORT is in use — stopping PID(s): $PIDS"
  kill -9 $PIDS 2>/dev/null || true
  sleep 0.2
fi
exec ./node_modules/.bin/next dev -p "$PORT"
