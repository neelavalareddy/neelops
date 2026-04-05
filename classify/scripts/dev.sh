#!/usr/bin/env sh
# Always use port 3000: free it first, clear stale dev output, then start Next.
PORT=3000
HOST=127.0.0.1
DEV_DIST=".next-dev"
PIDS=$(lsof -ti ":$PORT" 2>/dev/null || true)
if [ -n "$PIDS" ]; then
  echo "Port $PORT is in use — stopping PID(s): $PIDS"
  kill -9 $PIDS 2>/dev/null || true
  sleep 0.2
fi
if [ -d "$DEV_DIST" ]; then
  echo "Clearing stale $DEV_DIST build cache"
  rm -rf "$DEV_DIST"
fi
exec ./node_modules/.bin/next dev -H "$HOST" -p "$PORT"
