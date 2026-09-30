import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { LibraryUser } from "../users/types.ts";

export const SESSION_SECONDS = 30 * 24 * 60 * 60;
type UserRow = { id: string; phone: string; first_name: string; last_name: string; department: string; salt: string; password_hash: string };
function publicUser(row: UserRow, isAdmin: boolean): LibraryUser {
  return { id: row.id, phone: row.phone, isAdmin, user_metadata: { first_name: row.first_name, last_name: row.last_name, name: `${row.first_name} ${row.last_name}`, department: row.department } };
}
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export class AuthStore {
  private db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, phone TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL,
        last_name TEXT NOT NULL, department TEXT NOT NULL, salt TEXT NOT NULL,
        password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS login_attempts (phone TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS admin_phones (phone TEXT PRIMARY KEY);
    `);
  }
  grantAdmin(phone: string) { this.db.prepare("INSERT OR IGNORE INTO admin_phones (phone) VALUES (?)").run(phone); }
  private isAdmin(phone: string) { return Boolean(this.db.prepare("SELECT phone FROM admin_phones WHERE phone = ?").get(phone)); }
  register(phone: string, password: string, metadata: LibraryUser["user_metadata"]) {
    const existing = this.db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
    if (existing) throw new Error("Este telefone já está cadastrado. Use Entrar.");
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    const row: UserRow = { id: randomUUID(), phone, first_name: metadata.first_name, last_name: metadata.last_name, department: metadata.department, salt, password_hash: hash };
    this.db.prepare("INSERT INTO users (id, phone, first_name, last_name, department, salt, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(row.id, phone, row.first_name, row.last_name, row.department, salt, hash);
    return publicUser(row, this.isAdmin(phone));
  }
  login(phone: string, password: string) {
    const now = Date.now();
    this.db.prepare("DELETE FROM login_attempts WHERE expires_at < ?").run(now);
    const attempt = this.db.prepare("SELECT count FROM login_attempts WHERE phone = ?").get(phone);
    if (attempt && Number(attempt["count"]) >= 10) throw new Error("Muitas tentativas. Aguarde 15 minutos e tente novamente.");
    const row = this.db.prepare("SELECT * FROM users WHERE phone = ?").get(phone) as UserRow | undefined;
    const provided = scryptSync(password, row?.salt ?? "unknown-user", 64);
    if (!row || !timingSafeEqual(provided, Buffer.from(row.password_hash, "hex"))) {
      this.db.prepare("INSERT INTO login_attempts (phone, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(phone) DO UPDATE SET count = count + 1").run(phone, now + 15 * 60_000);
      throw new Error("Telefone ou senha incorretos. Confira e tente novamente.");
    }
    this.db.prepare("DELETE FROM login_attempts WHERE phone = ?").run(phone);
    return publicUser(row, this.isAdmin(phone));
  }
  createSession(userId: string) {
    this.db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
    const token = randomBytes(32).toString("hex");
    this.db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(tokenHash(token), userId, Date.now() + SESSION_SECONDS * 1000);
    return token;
  }
  getUser(token: string | undefined) {
    if (!token) return null;
    const row = this.db.prepare("SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ?").get(tokenHash(token), Date.now()) as UserRow | undefined;
    return row ? publicUser(row, this.isAdmin(row.phone)) : null;
  }
  logout(token: string | undefined) {
    if (token) this.db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
  }
  close() { this.db.close(); }
}
let instance: AuthStore | undefined;
export function authStore() {
  return instance ??= new AuthStore(resolve(process.env["LIBRARY_DB_PATH"] || ".next/database/data/library.sqlite"));
}
