import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLoanStore } from "./prototype-loans";

// Shared by devices connected to this prototype server. Reset on server restart.
const state = globalThis as typeof globalThis & { prototypeLoanStore?: ReturnType<typeof createLoanStore> };
function store() { return state.prototypeLoanStore ??= createLoanStore(); }
const userId = z.string().min(1).max(100);
export const readPrototypeLoans = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId }))
  .handler(({ data }) => store().snapshot(data.userId));
export const changePrototypeLoan = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId, action: z.enum(["borrow", "renew", "return"]), id: z.string().min(1).max(100) }))
  .handler(({ data }) => {
    try { return { ok: true as const, snapshot: store().change(data.userId, data.action, data.id) }; }
    catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : "Não foi possível alterar o empréstimo." }; }
  });
