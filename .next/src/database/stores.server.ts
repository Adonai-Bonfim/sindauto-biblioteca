import { postgresDatabase, initializeDatabase } from "./postgres.server.ts";
import { PostgresAuthStore } from "../auth/postgres.server.ts";
import { PostgresLibraryStore } from "../books/postgres.server.ts";

let online: Promise<{ auth: PostgresAuthStore; library: PostgresLibraryStore }> | undefined;
async function onlineStores() {
  if (!online) {
    const connection = postgresDatabase(process.env["DATABASE_URL"]!);
    online = initializeDatabase(connection.database).then(() => ({
      auth: new PostgresAuthStore(connection.database), library: new PostgresLibraryStore(connection.database),
    })).catch(async error => { online = undefined; await connection.close(); throw error; });
  }
  return online;
}
function usesNeon() {
  if (process.env["DATABASE_URL"]) return true;
  if (process.env["VERCEL"]) throw new Error("Configure DATABASE_URL para habilitar o banco de dados na Vercel.");
  return false;
}
export async function getAuthStore() {
  if (usesNeon()) return (await onlineStores()).auth;
  return (await import("../auth/store.server.ts")).authStore();
}
export async function getLibraryStore() {
  if (usesNeon()) return (await onlineStores()).library;
  return (await import("../books/store.server.ts")).libraryStore();
}
