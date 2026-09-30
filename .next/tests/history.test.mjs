import { test } from "node:test";
import assert from "node:assert/strict";
import { loanProgress } from "../src/history/status.ts";

test("prazo usa o calendário de Brasília e só atrasa após o dia da entrega", () => {
  assert.equal(loanProgress("2026-10-15", null, new Date("2026-09-30T15:00:00Z")).daysRemaining, 15);
  assert.equal(loanProgress("2026-10-15", null, new Date("2026-10-16T02:59:59Z")).status, "hoje");
  const overdue = loanProgress("2026-10-15", null, new Date("2026-10-16T03:00:00Z"));
  assert.equal(overdue.status, "atrasado");
  assert.equal(overdue.daysRemaining, -1);
});

test("devolução preserva o atraso registrado sem continuar contando", () => {
  const late = loanProgress("2026-10-15", "2026-10-17T15:00:00Z", new Date("2027-01-01T15:00:00Z"));
  assert.equal(late.status, "devolvido");
  assert.equal(late.daysRemaining, -2);
  assert.match(late.deadlineLabel, /2 dia/);
  assert.equal(loanProgress("2026-10-15", "2026-10-16T02:59:59Z").deadlineLabel, "Devolvido no prazo");
});
