@echo off
REM Start backend and frontend in separate cmd windows and open the frontend in the default browser
cd /d %~dp0

REM start backend (uses npm run dev)
start "Backend" cmd /k "cd backend && npm install --no-audit --no-fund && npm run dev"

REM start frontend (uses npm start)
start "Frontend" cmd /k "cd frontend && npm install --no-audit --no-fund && npm start"

REM give servers a moment then open the browser to frontend
timeout /t 3 >nul
REM Wait for both backend and frontend to be ready (requires npx)
npx wait-on http://localhost:3000/health/ready http://localhost:4200
start "" "http://localhost:4200"

exit /b 0
