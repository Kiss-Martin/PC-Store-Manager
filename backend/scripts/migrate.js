#!/usr/bin/env node
// Simple migration runner: executes SQL files in `db/migrations` against DATABASE_URL
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable not set.');
  process.exit(1);
}

async function run() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const full = path.join(migrationsDir, file);
    const sql = fs.readFileSync(full, 'utf8');
    console.log('Running', file);
    try {
      await client.query(sql);
    } catch (e) {
      console.error('Failed migration', file, e.message || e);
      await client.end();
      process.exit(1);
    }
  }
  console.log('Migrations complete');
  await client.end();
}

run().catch((e) => { console.error(e); process.exit(1); });
