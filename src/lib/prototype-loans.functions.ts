import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { libraryStore } from "../../.next/src/books/store.server";
import { requireUser } from "../../.next/src/auth/session.server";

export const readPrototypeLoans = createServerFn({ method: "GET" })
  .handler(() => { const user = requireUser(); return libraryStore().snapshot(user.id); });
export const changePrototypeLoan = createServerFn({ method: "POST" })
  .validator(z.object({ action: z.enum(["borrow", "renew", "return"]), id: z.string().min(1).max(100) }))
  .handler(({ data }) => {
    try { const user = requireUser(); return { ok: true as const, snapshot: libraryStore().change(user.id, data.action, data.id) }; }
    catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : "Não foi possível alterar o empréstimo." }; }
  });
