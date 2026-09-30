import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "../src/database/postgres.server.ts";
import { PostgresAuthStore } from "../src/auth/postgres.server.ts";
import { PostgresLibraryStore } from "../src/books/postgres.server.ts";
import { AuthStore } from "../src/auth/store.server.ts";
import { LibraryStore } from "../src/books/store.server.ts";
import { readLocalData, importLocalData } from "../src/database/migrate.server.ts";

test("PostgreSQL: migração preserva senha, administrador, livros e histórico; estoque e sessões", { timeout: 60_000 }, async () => {
  const folder = mkdtempSync(join(tmpdir(), "sindauto-neon-"));
  const file = join(folder, "test.sqlite");
  const sqliteAuth = new AuthStore(file);
  const sqliteBooks = new LibraryStore(file);
  const pg = new PGlite();
  const database = {
    query: (sql, values) => pg.query(sql, values),
    transaction: work => pg.transaction(async client => {
      await client.query("SELECT pg_advisory_xact_lock(734219)");
      return work(client);
    }),
  };
  try {
    const metadata = { name: "Teste Neon", first_name: "Teste", last_name: "Neon", department: "Teste" };
    const account = sqliteAuth.register("+5571999999999", "SenhaTeste123!", metadata);
    sqliteAuth.grantAdmin(account.phone);
    const bookData = { title: "Migração", author: "Autor", category: "Teste", cover: "/books/placeholder.svg", description: "", quantity: 1 };
    const oldBook = sqliteBooks.save(bookData);
    const oldLoan = sqliteBooks.change(account.id, "borrow", oldBook).loans[0];
    sqliteBooks.change(account.id, "return", oldLoan.id);
    sqliteBooks.remove(oldBook, 1);
    const data = readLocalData(file);
    await initializeDatabase(database);
    await initializeDatabase(database);
    await importLocalData(database, data);
    await assert.rejects(importLocalData(database, data), /já contém dados/);
    const auth = new PostgresAuthStore(database);
    const library = new PostgresLibraryStore(database);
    const migrated = await auth.login(account.phone, "SenhaTeste123!");
    assert.equal(migrated.id, account.id);
    assert.equal(migrated.isAdmin, true);
    assert.equal(migrated.password_hash, undefined);
    const history = (await library.adminHistory()).records[0];
    assert.equal(history.id, oldLoan.id);
    assert.equal(history.bookRemoved, true);
    assert.equal(history.status, "devolvido");
    assert.equal((await library.snapshot(account.id)).loans[0].book.cover, bookData.cover);
    const storedHash = (await pg.query("SELECT password_hash FROM users WHERE id=$1", [account.id])).rows[0].password_hash;
    assert.equal(storedHash, data.users[0].password_hash);
    assert.equal(await library.save(bookData), oldBook);
    await assert.rejects(library.save({ ...bookData, title: "MIGRAÇÃO" }), /já estão cadastrados/);
    const reader = await auth.register("+5571988888888", "SenhaTeste123!", metadata);
    assert.equal(reader.isAdmin, false);
    await assert.rejects(auth.grantAdmin("+5571977777777"), /Cadastre a conta/);
    const session = await auth.createSession(reader.id);
    assert.equal((await new PostgresAuthStore(database).getUser(session)).id, reader.id);
    assert.equal(await auth.getUser("inventado"), null);
    await auth.logout(session);
    assert.equal(await auth.getUser(session), null);
    const race = await Promise.allSettled([library.change(reader.id, "borrow", oldBook), library.change(account.id, "borrow", oldBook)]);
    assert.equal(race.filter(r => r.status === "fulfilled").length, 1);
    const winner = race[0].status === "fulfilled" ? reader : account;
    const other = winner.id === reader.id ? account : reader;
    const loan = (await library.snapshot(winner.id)).loans.find(l => !l.returnedAt);
    assert.equal((await library.books()).find(b => b.id === oldBook).availableCount, 0);
    assert.equal((await library.snapshot(other.id)).loans.some(l => l.id === loan.id), false);
    await assert.rejects(library.change(other.id, "return", loan.id), /não encontrado/);
    const revision = (await library.books()).find(b => b.id === oldBook).revision;
    await assert.rejects(library.remove(oldBook, revision), /ativos/);
    await assert.rejects(library.save({ ...bookData, quantity: 0 }, oldBook, revision), /menor/);
    await library.change(winner.id, "renew", loan.id);
    await assert.rejects(library.change(winner.id, "renew", loan.id), /já foi renovado/);
    await library.change(winner.id, "return", loan.id);
    await library.remove(oldBook, revision);
    assert.equal((await library.adminHistory()).records.length, 2);
    for (let i = 0; i < 10; i++) await assert.rejects(auth.login(reader.phone, "incorreta"), /Telefone ou senha/);
    await assert.rejects(auth.login(reader.phone, "SenhaTeste123!"), /Muitas tentativas/);
    assert.equal(readLocalData(file).loans.length, 1);
  } finally {
    sqliteAuth.close(); sqliteBooks.close(); await pg.close();
    rmSync(folder, { recursive: true, force: true });
  }
});

test("PostgreSQL: falha de importação desfaz todas as inserções", { timeout: 60_000 }, async () => {
  const pg = new PGlite();
  try {
    const db = { query: (sql, args) => pg.query(sql, args), transaction: work => pg.transaction(work) };
    await initializeDatabase(db);
    await assert.rejects(importLocalData(db, {
      users: [{ id: "user", phone: "123", first_name: "Teste", last_name: "Teste", department: "Teste", salt: "salt", password_hash: "hash", created_at: "2026-09-30" }],
      books: [], admin_phones: [],
      loans: [{ id: "loan", user_id: "user", book_id: "inexistente", checkout_date: "30/09/2026", checkout_time: "12:00", due_iso: "2026-10-15", returned_at: null, renewed: 0, created_at: "2026-09-30" }],
    }));
    assert.equal((await pg.query("SELECT * FROM users")).rows.length, 0);
  } finally { await pg.close(); }
});
