#!/usr/bin/env bash
set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "Installing subproject dependencies (backend/frontend)..."
npm --prefix backend install --no-audit --no-fund || true
npm --prefix frontend install --no-audit --no-fund || true

echo "Starting backend and frontend in background..."
cd backend && npm run dev &
cd "$ROOT_DIR"
cd frontend && npm start &

echo "Waiting for frontend to become available..."
echo "Waiting for backend and frontend to become available..."
if command -v npx >/dev/null 2>&1; then
  npx wait-on http://localhost:3000/health/ready http://localhost:4200
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:4200
elif command -v open >/dev/null 2>&1; then
  open http://localhost:4200
fi

echo "Started."
