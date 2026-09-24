import { test, expect } from "bun:test";
import { createLoanStore, loanDates } from "../src/lib/prototype-loans.ts";

test("prazo de 15 dias respeita a data brasileira e a mudança de mês", () => {
  expect(loanDates(new Date("2026-09-24T15:00:00Z")).dueDate).toBe("09/10/2026");
  expect(loanDates(new Date("2026-10-01T01:00:00Z")).checkoutDate).toBe("30/09/2026");
});
test("retirada bloqueia outro usuário, renovação atualiza prazo e devolução libera", () => {
  const store = createLoanStore();
  const a = store.change("a", "borrow", "habitos-atomicos", new Date("2026-09-24T15:00:00Z"));
  const id = a.loans[0].id;
  expect(store.snapshot("b").loans).toEqual([]);
  expect(store.snapshot("b").availability).toEqual([{ bookId: "habitos-atomicos", dueDate: "09/10/2026" }]);
  expect(() => store.change("b", "borrow", "habitos-atomicos")).toThrow("já foi emprestado");
  expect(() => store.change("b", "return", id)).toThrow();
  store.change("a", "renew", id);
  expect(store.snapshot("b").availability[0].dueDate).toBe("24/10/2026");
  expect(() => store.change("a", "renew", id)).toThrow();
  store.change("a", "return", id);
  expect(store.snapshot("b").availability).toEqual([]);
  expect(store.change("b", "borrow", "habitos-atomicos").loans).toHaveLength(1);
});
