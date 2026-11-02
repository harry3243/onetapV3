import fs from 'fs'; import { pool } from './db.js';
// Safe to run on every deploy: each migration file is applied once and recorded.
const dir = new URL('../migrations/', import.meta.url);
await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
const done = new Set((await pool.query('SELECT name FROM schema_migrations')).rows.map(r => r.name));
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
  if (done.has(f)) continue;
  const c = await pool.connect();
  try { await c.query('BEGIN'); await c.query(fs.readFileSync(new URL(f, dir), 'utf8')); await c.query('INSERT INTO schema_migrations(name) VALUES($1)', [f]); await c.query('COMMIT'); console.log('applied', f); }
  catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
}
await pool.end();
