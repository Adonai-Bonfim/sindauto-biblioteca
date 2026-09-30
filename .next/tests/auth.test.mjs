import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { AuthStore } from "../src/auth/store.server.ts";

test("cadastro e sessão sobrevivem à reabertura do banco, sem guardar a senha", () => {
  const directory = mkdtempSync(join(tmpdir(), "sindauto-auth-"));
  const path = join(directory, "test.sqlite");
  let store = new AuthStore(path);
  try {
    const metadata = { name: "Teste Leitor", first_name: "Teste", last_name: "Leitor", department: "Teste" };
    const user = store.register("+5571999999999", "SenhaTeste123!", metadata);
    const session = store.createSession(user.id);
    store.close();
    store = new AuthStore(path);
    assert.equal(store.login(user.phone, "SenhaTeste123!").id, user.id);
    assert.equal(store.getUser(session)?.id, user.id);
    assert.throws(() => store.login(user.phone, "SenhaErrada"), /Telefone ou senha/);
    assert.throws(() => store.register(user.phone, "OutraSenha123!", metadata), /já está cadastrado/);
    assert.equal(store.getUser("token-inventado"), null);
    const inspection = new DatabaseSync(path);
    const row = inspection.prepare("SELECT * FROM users").get();
    assert.ok(!JSON.stringify(row).includes("SenhaTeste123!"));
    assert.ok(!JSON.stringify(inspection.prepare("SELECT * FROM sessions").get()).includes(session));
    inspection.close();
    store.logout(session);
    assert.equal(store.getUser(session), null);
    assert.equal(store.login(user.phone, "SenhaTeste123!").id, user.id);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});
