import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { toJSON, fromCrossJSON } from "seroval";
import { AuthStore } from "../src/auth/store.server.ts";

test("HTTP: cadastro, cookie, outro dispositivo, reinício e saída", { timeout: 30_000 }, async () => {
  const folder = mkdtempSync(join(tmpdir(), "sindauto-http-"));
  const base = "http://127.0.0.1:3198";
  const setup = new AuthStore(join(folder, "library.sqlite"));
  setup.grantAdmin("+5571999999999"); setup.close();
  const directory = resolve(".output/server");
  const manifest = readFileSync(join(directory, readdirSync(directory).find(name => name.startsWith("__23tanstack-start-server-fn-resolver-"))), "utf8");
  const ids = Object.fromEntries([...manifest.matchAll(/"([a-f0-9]+)":\s*\{\s*functionName: "(\w+)_createServerFn_handler"/g)].map(match => [match[2], match[1]]));
  let server;
  async function start() {
    server = spawn(process.execPath, [join(directory, "index.mjs")], { env: { ...process.env, PORT: "3198", HOST: "127.0.0.1", LIBRARY_DB_PATH: join(folder, "library.sqlite") }, stdio: "pipe", windowsHide: true });
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch(base)).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Servidor de teste não iniciou.");
  }
  async function stop() { if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill(); await exited; } }
  async function call(name, data, cookie = "", method = "POST") {
    assert.ok(ids[name], `Função ${name} disponível`);
    const payload = JSON.stringify(toJSON({ data }));
    // HTTP LAN browsers may omit Fetch Metadata; exercise Origin/Referer checks.
    const headers = { "x-tsr-serverFn": "true", referer: base + "/", ...(method === "POST" ? { origin: base } : {}), "content-type": "application/json", cookie };
    const response = await fetch(`${base}/_serverFn/${ids[name]}${method === "GET" ? "?payload=" + encodeURIComponent(payload) : ""}`, { method, headers, ...(method === "POST" ? { body: payload } : {}) });
    const text = await response.text();
    assert.equal(response.status, 200, text);
    const body = fromCrossJSON(JSON.parse(text), {});
    return { result: body.result, error: body.error, cookie: response.headers.get("set-cookie") };
  }
  try {
    await start();
    assert.equal((await call("readSession", undefined, "", "GET")).result, null);
    const account = { phone: "71999999999", password: "SenhaTeste123!", metadata: { first_name: "Teste", last_name: "HTTP", department: "Teste" } };
    const created = await call("registerUser", account);
    assert.equal(created.result.ok, true);
    assert.match(created.cookie, /HttpOnly/i);
    const cookie = created.cookie.split(";")[0];
    const id = created.result.user.id;
    assert.equal(created.result.user.isAdmin, true);
    assert.equal((await call("readSession", undefined, cookie, "GET")).result.id, id);
    assert.equal((await call("loginUser", { phone: account.phone, password: "Errada123!" })).result.ok, false);
    assert.equal((await call("registerUser", account)).result.ok, false);
    const reader = await call("registerUser", { ...account, phone: "71988888888" });
    assert.equal(reader.result.user.isAdmin, false);
    const readerCookie = reader.cookie.split(";")[0];
    for (const deniedCookie of ["", readerCookie]) {
      const denied = (await call("readAdminHistory", undefined, deniedCookie, "GET")).result;
      assert.equal(denied.ok, false);
      assert.equal(denied.history, undefined);
    }
    const book = { title: "Livro HTTP", author: "Teste", category: "Teste", description: "", cover: "", quantity: 1 };
    assert.equal((await call("saveBook", { book })).result.ok, false);
    assert.equal((await call("saveBook", { book }, readerCookie)).result.ok, false);
    const saved = await call("saveBook", { book }, cookie);
    assert.equal(saved.result.ok, true);
    const bookId = saved.result.id;
    assert.equal((await call("removeBook", { id: bookId, revision: 1 }, readerCookie)).result.ok, false);
    assert.equal((await call("removeBook", { id: bookId, revision: 1 })).result.ok, false);
    const race = await Promise.all([call("changePrototypeLoan", { action: "borrow", id: bookId }, cookie), call("changePrototypeLoan", { action: "borrow", id: bookId }, readerCookie)]);
    assert.equal(race.filter(item => item.result.ok).length, 1);
    const winnerCookie = race[0].result.ok ? cookie : readerCookie;
    const loserCookie = race[0].result.ok ? readerCookie : cookie;
    const borrowed = race.find(item => item.result.ok).result.snapshot.loans[0];
    const history = (await call("readAdminHistory", undefined, cookie, "GET")).result;
    assert.equal(history.ok, true);
    assert.equal(history.history.records.length, 1);
    assert.equal(history.history.records[0].id, borrowed.id);
    assert.equal(history.history.records[0].person, "Teste HTTP");
    assert.equal(history.history.records[0].title, book.title);
    assert.equal(history.history.records[0].daysRemaining, 15);
    assert.equal(history.history.records[0].status, "em-dia");
    assert.doesNotMatch(JSON.stringify(history), /password|salt|token_hash/);
    assert.equal((await call("removeBook", { id: bookId, revision: 1 }, cookie)).result.ok, false);
    const otherView = (await call("readPrototypeLoans", undefined, loserCookie, "GET")).result;
    assert.equal(otherView.books.find(book => book.id === bookId).status, "Emprestado");
    assert.equal(otherView.loans.length, 0);
    assert.equal((await call("changePrototypeLoan", { action: "return", id: borrowed.id }, loserCookie)).result.ok, false);
    await stop();
    await start();
    const restored = (await call("readPrototypeLoans", undefined, winnerCookie, "GET")).result;
    assert.equal(restored.loans[0].id, borrowed.id);
    assert.equal(restored.books.find(book => book.id === bookId).availableCount, 0);
    const returned = await call("changePrototypeLoan", { action: "return", id: borrowed.id }, winnerCookie);
    assert.equal(returned.result.snapshot.loans[0].status, "devolvido");
    assert.equal(returned.result.snapshot.books.find(book => book.id === bookId).availableCount, 1);
    assert.equal((await call("removeBook", { id: bookId, revision: 1 }, cookie)).result.ok, true);
    const removedView = (await call("readPrototypeLoans", undefined, winnerCookie, "GET")).result;
    assert.equal(removedView.books.some(book => book.id === bookId), false);
    assert.equal(removedView.loans[0].book.title, book.title);
    const archived = (await call("readAdminHistory", undefined, cookie, "GET")).result.history.records[0];
    assert.equal(archived.status, "devolvido");
    assert.equal(archived.bookRemoved, true);
    assert.ok(archived.returnedAt);
    assert.equal((await call("readSession", undefined, cookie, "GET")).result.id, id);
    const second = await call("loginUser", { phone: account.phone, password: account.password });
    assert.equal(second.result.user.id, id);
    const secondCookie = second.cookie.split(";")[0];
    await call("logoutUser", undefined, cookie);
    assert.equal((await call("readSession", undefined, cookie, "GET")).result, null);
    assert.equal((await call("readSession", undefined, secondCookie, "GET")).result.id, id);
  } finally { await stop(); rmSync(folder, { recursive: true, force: true }); }
});
