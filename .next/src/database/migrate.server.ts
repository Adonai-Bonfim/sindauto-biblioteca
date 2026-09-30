import { DatabaseSync } from "node:sqlite";
import type { SqlDatabase } from "./postgres.server.ts";

const columns = {
  users: ["id", "phone", "first_name", "last_name", "department", "salt", "password_hash", "created_at"],
  books: ["id", "title", "author", "category", "description", "cover", "quantity", "revision", "removed_at"],
  loans: ["id", "user_id", "book_id", "checkout_date", "checkout_time", "due_iso", "returned_at", "renewed", "created_at"],
  admin_phones: ["phone"],
} as const;
type Table = keyof typeof columns;

export function readLocalData(path: string) {
  // Read-only, consistent SQLite snapshot. Never resets or edits the original database.
  const sqlite = new DatabaseSync(path, { readOnly: true });
  try {
    sqlite.exec("BEGIN");
    const data = Object.fromEntries(Object.entries(columns).map(([table, fields]) => [table,
      sqlite.prepare(`SELECT ${fields.join(",")} FROM ${table}`).all(),
    ])) as Record<Table, Record<string, unknown>[]>;
    sqlite.exec("COMMIT");
    for (const row of [...data.users, ...data.loans]) {
      const value = String(row["created_at"]);
      row["created_at"] = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z").toISOString();
    }
    // Do not carry over admin invitations that a future public signup could claim.
    data.admin_phones = data.admin_phones.filter(admin => data.users.some(user => user["phone"] === admin["phone"]));
    return data;
  } finally { sqlite.close(); }
}
export async function importLocalData(database: SqlDatabase, data: ReturnType<typeof readLocalData>, preserveOnlineUsers = false) {
  await database.transaction(async client => {
    const emptyTables = preserveOnlineUsers ? ["books", "loans"] : [...Object.keys(columns), "sessions", "login_attempts"];
    for (const table of emptyTables) {
      if ((await client.query(`SELECT 1 FROM ${table} LIMIT 1`)).rows.length) {
        throw new Error("O banco de destino já contém dados. Migração cancelada para não sobrescrever registros.");
      }
    }
    const userIds = new Map<unknown, unknown>();
    for (const table of Object.keys(columns) as Table[]) {
      const fields = columns[table];
      for (const row of data[table]) {
        if (preserveOnlineUsers && table === "users") {
          const existing = (await client.query("SELECT id FROM users WHERE phone=$1", [row["phone"]])).rows[0];
          if (existing) { userIds.set(row["id"], existing.id); continue; }
        }
        const mapped = table === "loans" ? { ...row, user_id: userIds.get(row["user_id"]) ?? row["user_id"] } : row;
        const conflict = preserveOnlineUsers && table === "admin_phones" ? " ON CONFLICT(phone) DO NOTHING" : "";
        await client.query(`INSERT INTO ${table}(${fields.join(",")}) VALUES(${fields.map((_, i) => `$${i + 1}`).join(",")})${conflict}`, fields.map(field => mapped[field]));
      }
    }
  });
}
