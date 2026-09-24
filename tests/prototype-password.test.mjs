import { test, expect } from "bun:test";
import { pbkdf2 } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { hashPrototypePassword } from "../src/lib/prototype-password.ts";

test("processamento separado preserva a senha de contas já cadastradas", async () => {
  const expected = bytesToHex(pbkdf2(sha256, "Teste123!", "salt-de-teste", { c: 100_000, dkLen: 32 }));
  expect(await hashPrototypePassword("Teste123!", "salt-de-teste")).toBe(expected);
});

test("falha ao carregar a tarefa libera a espera e encerra o processamento", async () => {
  const OriginalWorker = globalThis.Worker;
  let terminated = false;
  globalThis.Worker = class {
    postMessage() { queueMicrotask(() => this.onerror()); }
    terminate() { terminated = true; }
  };
  try {
    await expect(hashPrototypePassword("Teste123!", "salt")).rejects.toThrow("Atualize a página");
    expect(terminated).toBe(true);
  } finally { globalThis.Worker = OriginalWorker; }
});
