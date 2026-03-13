PC Store Manager — Monorepo
===========================

Quick start
-----------

Install root dev dependencies and project packages, then start both backend and frontend together:

```bash
# from repository root
npm install
npm run install:all   # installs backend/frontend deps
npm run dev:open      # starts backend+frontend and opens browser when ready
npm run dev:launch    # alternative: runs the cross-platform Node launcher (start.js)
```

Alternative (Windows one-click)
--------------------------------
Double-click `start.bat` to open two cmd windows (backend and frontend) and the browser.

Notes
-----
- Backend default port: `3000` (see `backend/src/index.js`).
- Frontend default: `http://localhost:4200`.
- `dev:open` uses `wait-on` to wait for the frontend to respond before opening the browser.

VS Code
-------
Open the folder in VS Code and run the `Run Dev` task from the Task Runner (defined in `.vscode/tasks.json`).
# PC Shop Inventory Management System

Web-based raktárkezelő rendszer számítástechnikai üzletek számára.

## Fő funkciók
- termékek kezelése (CRUD)
- kategóriák és márkák kezelése
- feladatkiosztás dolgozóknak
- műveletek naplózása
- admin és dolgozói jogosultságok

## Használt technológiák
- Frontend: Angular + Tailwind CSS
- Backend: Node.js + Express
- Adatbázis: PostgreSQL (Supabase)
- Verziókezelés: Git + GitHub

## Projekt struktúra
- `/backend` – REST API
- `/frontend` – Angular kliens
- `/docs` – dokumentáció
