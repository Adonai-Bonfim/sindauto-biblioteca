import { test, expect } from "bun:test";
import { PGlite } from "@electric-sql/pglite";
import { initializeDatabase } from "../.next/src/database/postgres.server.ts";
import { PostgresLibraryStore } from "../.next/src/books/postgres.server.ts";

test("um empréstimo por usuário: concorrência, renovação e liberação após devolução", async () => {
  const pg = new PGlite();
  try {
    const db = { query: (sql, args) => pg.query(sql, args), transaction: work => pg.transaction(work) };
    await initializeDatabase(db);
    for (const id of ["a", "b"]) await pg.query("INSERT INTO users(id,phone,first_name,last_name,department,salt,password_hash) VALUES($1,$1,'Teste','Teste','Teste','fixture','fixture')", [id]);
    const store = new PostgresLibraryStore(db);
    const ids = [];
    for (const title of ["Primeiro", "Segundo"]) ids.push(await store.save({title,author:"Autor",category:"Teste",description:"",cover:"",quantity:3}));
    const results = await Promise.allSettled(ids.map(id => store.change("a", "borrow", id)));
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    const loan = (await store.snapshot("a")).loans[0];
    const other = ids.find(id => id !== loan.bookId);
    await store.change("a", "renew", loan.id);
    await expect(store.change("a", "borrow", other)).rejects.toThrow("Devolva-o");
    await store.change("b", "borrow", other);
    await store.change("a", "return", loan.id);
    await store.change("a", "borrow", other);
    const history = (await store.snapshot("a")).loans;
    expect(history).toHaveLength(2);
    expect(history.filter(l => !l.returnedAt)).toHaveLength(1);
  } finally { await pg.close(); }
}, 60_000);
