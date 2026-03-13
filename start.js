#!/usr/bin/env node
/*
 Cross-platform Node launcher for starting backend and frontend together,
 waiting for readiness endpoints, streaming logs, and opening the browser.
*/
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

function spawnProcess(name, cmd, args, opts = {}) {
  const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true, ...opts });
  p.stdout.on('data', (d) => process.stdout.write(`[${name}] ${d}`));
  p.stderr.on('data', (d) => process.stderr.write(`[${name}] ${d}`));
  p.on('exit', (code, sig) => console.log(`[${name}] exited code=${code} sig=${sig}`));
  return p;
}

function waitForUrl(url, { interval = 1000, timeout = 120000 } = {}) {
  const start = Date.now();
  const client = url.startsWith('https://') ? https : http;
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = client.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          res.resume();
          return resolve(true);
        }
        res.resume();
        if (Date.now() - start > timeout) return reject(new Error(`Timeout waiting for ${url}`));
        setTimeout(check, interval);
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error(`Timeout waiting for ${url}`));
        setTimeout(check, interval);
      });
      req.setTimeout(5000, () => req.abort());
    };
    check();
  });
}

function openBrowser(url) {
  const platform = process.platform;
  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' });
  } else if (platform === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' });
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
  }
}

async function main() {
  console.log('Starting backend and frontend...');
  const backendCwd = path.join(ROOT, 'backend');
  const frontendCwd = path.join(ROOT, 'frontend');

  const backend = spawnProcess('backend', 'npm', ['run', 'dev'], { cwd: backendCwd });
  const frontend = spawnProcess('frontend', 'npm', ['start'], { cwd: frontendCwd });

  const backendHealth = process.env.BACKEND_HEALTH || 'http://localhost:3000/health/ready';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  try {
    console.log(`Waiting for backend readiness at ${backendHealth} ...`);
    await waitForUrl(backendHealth, { interval: 1000, timeout: 120000 });
    console.log('Backend ready.');
  } catch (e) {
    console.warn('Backend readiness check failed:', e.message || e);
  }

  try {
    console.log(`Waiting for frontend at ${frontendUrl} ...`);
    await waitForUrl(frontendUrl, { interval: 1000, timeout: 120000 });
    console.log('Frontend ready.');
  } catch (e) {
    console.warn('Frontend readiness check failed:', e.message || e);
  }

  try {
    console.log('Opening browser to', frontendUrl);
    openBrowser(frontendUrl);
  } catch (e) {
    console.warn('Failed to open browser:', e && e.message ? e.message : e);
  }

  const shutdown = () => {
    console.log('Shutting down child processes...');
    try { backend.kill(); } catch (e) { /* ignore */ }
    try { frontend.kill(); } catch (e) { /* ignore */ }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((e) => {
  console.error('Launcher error', e && e.message ? e.message : e);
  process.exit(1);
});
