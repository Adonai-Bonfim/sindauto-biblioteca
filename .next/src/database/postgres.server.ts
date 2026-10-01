import { Pool } from "pg";
import { isCloudflareWorker } from "./runtime.server.ts";
import { traceStage } from "../../../src/lib/server-diagnostics.server";

export interface SqlClient {
  query(sql: string, values?: unknown[]): Promise<{ rows: any[] }>;
}
export interface SqlDatabase extends SqlClient {
  transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T>;
}

export function postgresDatabase(connectionString: string) {
  const createPool = () => {
    const pool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000, query_timeout: 5_000, statement_timeout: 5_000, allowExitOnIdle: true });
    // Never log connection strings, query parameters, or raw database errors.
    pool.on("error", () => console.error("Conexão PostgreSQL interrompida."));
    return pool;
  };
  // Worker sockets belong to the request that opened them. Never reuse them
  // across requests; Neon provides pooling on its own pooled endpoint.
  const sharedPool = isCloudflareWorker() ? undefined : createPool();
  async function withPool<T>(work: (pool: Pool) => Promise<T>): Promise<T> {
    const pool = sharedPool ?? createPool();
    try { return await work(pool); }
    finally { if (!sharedPool) await traceStage("db.pool.end", () => pool.end(), 2_000); }
  }
  async function withClient<T>(work: (client: SqlClient) => Promise<T>): Promise<T> {
    return withPool(async pool => {
      let expired = false;
      const pending = pool.connect().then(client => {
        if (expired) { client.release(true); throw new Error("DATABASE_OPERATION_TIMEOUT"); }
        return client;
      });
      const client = await traceStage("db.pool.connect", () => pending, 6_000).catch(error => { expired = true; throw error; });
      let failed = false;
      const traced: SqlClient = { query: (sql, values) => traceStage("db.query", () => client.query(sql, values), 6_000) };
      try { return await work(traced); }
      catch (error) { failed = true; throw error; }
      finally { client.release(failed); }
    });
  }
  const database: SqlDatabase = {
    query: (sql, values) => withClient(client => client.query(sql, values)),
    async transaction(work) {
      return withClient(async client => {
      try {
        await client.query("BEGIN");
        // Serialize library writes across all serverless instances, including migrations.
        await client.query("SELECT pg_advisory_xact_lock(734219)");
        const result = await work(client);
        await client.query("COMMIT");
        return result;
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      });
    },
  };
  return { database, close: async () => { await sharedPool?.end(); } };
}

export const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, phone TEXT NOT NULL UNIQUE, first_name TEXT NOT NULL,
  last_name TEXT NOT NULL, department TEXT NOT NULL, salt TEXT NOT NULL,
  password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (phone TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_phones (phone TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, category TEXT NOT NULL,
  description TEXT NOT NULL, cover TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity >= 0),
  revision INTEGER NOT NULL DEFAULT 1, removed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS books_title_author_idx ON books(lower(title), lower(author));
CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), book_id TEXT NOT NULL REFERENCES books(id),
  checkout_date TEXT NOT NULL, checkout_time TEXT NOT NULL, due_iso TEXT NOT NULL,
  returned_at TEXT, renewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
);
CREATE INDEX IF NOT EXISTS loans_user_idx ON loans(user_id);
CREATE INDEX IF NOT EXISTS loans_active_idx ON loans(book_id) WHERE returned_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS loans_user_book_active_idx ON loans(user_id, book_id) WHERE returned_at IS NULL;
`;

export async function initializeDatabase(database: SqlDatabase) {
  await database.transaction(async client => {
    for (const statement of schema.split(";").filter(part => part.trim())) await client.query(statement);
  });
}
