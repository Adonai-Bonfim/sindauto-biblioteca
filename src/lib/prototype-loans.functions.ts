import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getLibraryStore } from "../../.next/src/database/stores.server";
import { requireUser } from "../../.next/src/auth/session.server";

export const readPrototypeLoans = createServerFn({ method: "GET" })
  .handler(async () => { const user = await requireUser(); return (await getLibraryStore()).snapshot(user.id); });
export const changePrototypeLoan = createServerFn({ method: "POST" })
  .validator(z.object({ action: z.enum(["borrow", "renew", "return"]), id: z.string().min(1).max(100) }))
  .handler(async ({ data }) => {
    try { const user = await requireUser(); return { ok: true as const, snapshot: await (await getLibraryStore()).change(user.id, data.action, data.id) }; }
    catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : "Não foi possível alterar o empréstimo." }; }
  });
