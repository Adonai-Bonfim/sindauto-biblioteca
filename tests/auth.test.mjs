import { test, expect } from "bun:test";
import { normalizePhone, authErrorMessage } from "../src/lib/auth.ts";

test("o mesmo telefone mantém o login com ou sem formatação e código do país", () => {
  for (const phone of ["(71) 99999-9999", "71999999999", "+55 71 99999-9999"]) {
    expect(normalizePhone(phone)).toBe("+5571999999999");
  }
  expect(normalizePhone("(11) 3333-4444")).toBe("+551133334444");
});

test("recusa telefones incompletos e DDD inválido", () => {
  for (const phone of ["", "123", "00999999999", "+441234567890"]) {
    expect(() => normalizePhone(phone)).toThrow();
  }
});

test("traduz erros de acesso sem expor detalhes internos", () => {
  expect(authErrorMessage({ code: "invalid_credentials" })).toContain("Telefone ou senha incorretos");
  expect(authErrorMessage({ code: "phone_exists" })).toContain("já está cadastrado");
  expect(authErrorMessage(new Error("internal details"))).not.toContain("internal details");
});

test("distingue cadastro por telefone desativado de senha inválida", () => {
  expect(authErrorMessage({ code: "phone_provider_disabled" })).toContain("Não é um problema com sua senha");
  expect(authErrorMessage({ code: "signup_disabled" })).toContain("Novos cadastros estão desativados");
  expect(authErrorMessage({ code: "weak_password" })).toContain("pelo menos 8 caracteres");
});
