import { test, expect } from "bun:test";
import { getPrototypeUser, signUpPrototype, signInPrototype, signOutPrototype } from "../src/lib/prototype-auth.ts";

test("cadastro local, sessão, saída e login com validação da senha", async () => {
  const values = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: new EventTarget() });
  try {
    const metadata = { name: "Leitor Teste", first_name: "Leitor", last_name: "Teste", department: "Teste" };
    await expect(signUpPrototype("71999999999", "curta", metadata)).rejects.toThrow("8 caracteres");
    await signUpPrototype("71999999999", "Teste123!", metadata);
    expect(getPrototypeUser().user_metadata.name).toBe("Leitor Teste");
    expect([...values.values()].join()).not.toContain("Teste123!");
    await expect(signUpPrototype("+55 71 99999-9999", "Teste123!", metadata)).rejects.toThrow("já está cadastrado");
    signOutPrototype();
    expect(getPrototypeUser()).toBeNull();
    await expect(signInPrototype("71999999999", "Errada123!")).rejects.toThrow("Telefone ou senha incorretos");
    expect(getPrototypeUser()).toBeNull();
    await signInPrototype("(71) 99999-9999", "Teste123!");
    expect(getPrototypeUser().phone).toBe("+5571999999999");
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
    else delete globalThis.localStorage;
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else delete globalThis.window;
  }
}, 30_000);
