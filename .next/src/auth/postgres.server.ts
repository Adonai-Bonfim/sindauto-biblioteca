import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import type { SqlDatabase, SqlClient } from "../database/postgres.server.ts";
import type { LibraryUser } from "../users/types.ts";

const SESSION_SECONDS = 30 * 24 * 60 * 60;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export class PostgresAuthStore {
  private db: SqlDatabase;
  constructor(db: SqlDatabase) { this.db = db; }
  private async publicUser(row: any, client: SqlClient = this.db): Promise<LibraryUser> {
    const admin = await client.query("SELECT phone FROM admin_phones WHERE phone=$1", [row.phone]);
    return { id: row.id, phone: row.phone, isAdmin: admin.rows.length > 0, user_metadata: {
      first_name: row.first_name, last_name: row.last_name, name: `${row.first_name} ${row.last_name}`, department: row.department,
    } };
  }
  async grantAdmin(phone: string) {
    // Require an existing account; public sign-up must never claim an unregistered admin phone.
    await this.db.transaction(async client => {
      if (!(await client.query("SELECT id FROM users WHERE phone=$1", [phone])).rows.length) throw new Error("Cadastre a conta antes de autorizar o administrador.");
      await client.query("INSERT INTO admin_phones(phone) VALUES($1) ON CONFLICT DO NOTHING", [phone]);
    });
  }
  async register(phone: string, password: string, metadata: LibraryUser["user_metadata"]) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return this.db.transaction(async client => {
      if ((await client.query("SELECT id FROM users WHERE phone=$1", [phone])).rows.length) throw new Error("Este telefone já está cadastrado. Use Entrar.");
      const { rows } = await client.query(`INSERT INTO users(id,phone,first_name,last_name,department,salt,password_hash)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [randomUUID(), phone, metadata.first_name, metadata.last_name, metadata.department, salt, hash]);
      return this.publicUser(rows[0], client);
    });
  }
  async login(phone: string, password: string) {
    const result = await this.db.transaction(async client => {
      const now = Date.now();
      await client.query("DELETE FROM login_attempts WHERE expires_at < $1", [now]);
      const attempt = (await client.query("SELECT count FROM login_attempts WHERE phone=$1", [phone])).rows[0];
      if (attempt?.count >= 10) return { error: "Muitas tentativas. Aguarde 15 minutos e tente novamente." };
      const row = (await client.query("SELECT * FROM users WHERE phone=$1", [phone])).rows[0];
      const provided = scryptSync(password, row?.salt ?? "unknown-user", 64);
      if (!row || !timingSafeEqual(provided, Buffer.from(row.password_hash, "hex"))) {
        await client.query(`INSERT INTO login_attempts(phone,count,expires_at) VALUES($1,1,$2)
          ON CONFLICT(phone) DO UPDATE SET count=login_attempts.count+1`, [phone, now + 15 * 60_000]);
        return { error: "Telefone ou senha incorretos. Confira e tente novamente." };
      }
      await client.query("DELETE FROM login_attempts WHERE phone=$1", [phone]);
      return { user: await this.publicUser(row, client) };
    });
    if (result.error) throw new Error(result.error);
    return result.user!;
  }
  async createSession(userId: string) {
    await this.db.query("DELETE FROM sessions WHERE expires_at < $1", [Date.now()]);
    const token = randomBytes(32).toString("hex");
    await this.db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)", [tokenHash(token), userId, Date.now() + SESSION_SECONDS * 1000]);
    return token;
  }
  async getUser(token: string | undefined) {
    if (!token) return null;
    const row = (await this.db.query(`SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id
      WHERE s.token_hash=$1 AND s.expires_at>$2`, [tokenHash(token), Date.now()])).rows[0];
    return row ? this.publicUser(row) : null;
  }
  async logout(token: string | undefined) {
    if (token) await this.db.query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash(token)]);
  }
}
