import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = process.env.IGNIS_DATA_DIR || path.resolve('data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'ignis.db'));
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'colaborador',
  status TEXT NOT NULL DEFAULT 'pendente',
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  matricula TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  photo TEXT,
  linha TEXT, cargo TEXT, turno TEXT, time TEXT, posto TEXT,
  tipo_melhoria TEXT,
  previa TEXT,
  idea TEXT,
  must_change_password INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_login TEXT
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'andamento',
  tipo_melhoria TEXT,
  linha TEXT,
  owner_id TEXT,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);
CREATE TABLE IF NOT EXISTS resets (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL,
  used INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reset_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  resolved INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT,
  text TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

const secretFile = path.join(DATA_DIR, 'secret.key');
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(48).toString('hex'));
export const JWT_SECRET = process.env.JWT_SECRET || fs.readFileSync(secretFile, 'utf8');

export const id = () => crypto.randomUUID();
export const one = (sql, ...a) => db.prepare(sql).get(...a);
export const all = (sql, ...a) => db.prepare(sql).all(...a);
export const run = (sql, ...a) => db.prepare(sql).run(...a);

export function publicUser(u, full = true) {
  if (!u) return null;
  const base = {
    id: u.id, role: u.role, status: u.status, name: u.name, photo: u.photo,
    cargo: u.cargo, linha: u.linha,
  };
  if (!full) return base;
  return {
    ...base, email: u.email, matricula: u.matricula, turno: u.turno, time: u.time, posto: u.posto,
    tipoMelhoria: u.tipo_melhoria, previa: u.previa, idea: u.idea ? JSON.parse(u.idea) : null,
    mustChangePassword: !!u.must_change_password, createdAt: u.created_at, lastLogin: u.last_login,
  };
}
